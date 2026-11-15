import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { downloadCsv } from "@/lib/csv";

type Store = { id: number; nom: string };
type Category = { id: number; nom: string };
type Product = { id: number; nom: string; reference: string | null };
type Line = { id: number; produitNom: string; produitReference: string | null; quantiteTheorique: number; quantiteComptee: number | null; coutUnitaire: string; version: number };
type Inventory = { id: number; reference: string; libelle: string; statut: string; boutique: { nom: string }; lignes: Line[]; canValidate?: boolean; canCancel?: boolean; _count?: { lignes: number } };
async function data<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(path, init);
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "La requête a échoué.");
  return body.data as T;
}

export default function InventoriesPage() {
  const { id } = useParams();
  const [rows, setRows] = useState<Inventory[]>([]);
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreId] = useState("");
  const [label, setLabel] = useState("");
  const [selection, setSelection] = useState("ALL");
  const [categoryId, setCategoryId] = useState("");
  const [productIds, setProductIds] = useState<number[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    setError("");
    try {
      const [inventoryRows, storeRows, categoryRows, productPage] = await Promise.all([data<Inventory[]>("/api/inventories"), data<Store[]>("/api/stores"), data<Category[]>("/api/categories"), data<{ products: Product[]; totalPages: number }>("/api/pages/produits?limit=100&page=1")]);
      const remaining = await Promise.all(Array.from({ length: Math.max(0, productPage.totalPages - 1) }, (_, index) => data<{ products: Product[] }>(`/api/pages/produits?limit=100&page=${index + 2}`)));
      setRows(inventoryRows); setStores(storeRows); setStoreId((old) => old || String(storeRows[0]?.id ?? "")); setCategories(categoryRows); setProducts([...productPage.products, ...remaining.flatMap((page) => page.products)]);
      if (id) setInventory(await data<Inventory>(`/api/inventories/${id}`));
    } catch (e) { setError(e instanceof Error ? e.message : "Chargement impossible."); }
  }, [id]);
  useEffect(() => { void Promise.resolve().then(refresh); }, [refresh]);
  async function create() {
    setBusy(true); setError("");
    try {
      const payload = { boutiqueId: Number(storeId), libelle: label || "Inventaire physique", selectionType: selection, ...(selection === "CATEGORY" ? { categorieId: Number(categoryId) } : {}), ...(selection === "MANUAL" ? { produitIds: productIds } : {}) };
      await data("/api/inventories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      setLabel(""); await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Création impossible."); } finally { setBusy(false); }
  }
  async function count(line: Line, value: string) {
    if (value === "") return;
    try { await data(`/api/inventories/${id}/lines/${line.id}/count`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quantiteComptee: Number(value), version: line.version }) }); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Comptage impossible."); }
  }
  async function action(name: "validate" | "cancel") {
    setBusy(true); setError("");
    try { await data(`/api/inventories/${id}/${name}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: name === "cancel" ? JSON.stringify({ motif: "Annulation demandée depuis l’application" }) : "{}" }); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Opération impossible."); } finally { setBusy(false); }
  }
  const counted = inventory?.lignes.filter((line) => line.quantiteComptee !== null).length ?? 0;
  const difference = (line: Line) => line.quantiteComptee === null ? null : line.quantiteComptee - line.quantiteTheorique;
  return <main className="space-y-6 p-6">
    <PageHeader title={id ? "Comptage d’inventaire" : "Inventaires physiques"} description="Les quantités théoriques sont conservées au démarrage de chaque session." />
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {id && inventory ? <>
      <section className="rounded-xl border border-line bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">{inventory.reference} · {inventory.libelle}</h2><p className="text-sm text-muted">{inventory.boutique.nom} · {inventory.statut} · {counted}/{inventory.lignes.length} comptés</p></div><div className="flex gap-2"><Button variant="secondary" onClick={() => downloadCsv(`${inventory.reference}.csv`, ["Produit", "Référence", "Théorique", "Compté", "Écart", "Coût unitaire", "Valeur écart"], inventory.lignes.map((line) => { const delta = line.quantiteComptee === null ? null : line.quantiteComptee - line.quantiteTheorique; return [line.produitNom, line.produitReference, line.quantiteTheorique, line.quantiteComptee, delta, Number(line.coutUnitaire), delta === null ? null : delta * Number(line.coutUnitaire)]; }))}>Exporter CSV</Button>{inventory.statut === "IN_PROGRESS" && <>{inventory.canValidate && <Button disabled={busy || counted !== inventory.lignes.length} onClick={() => void action("validate")}>Valider l’inventaire</Button>}{inventory.canCancel && <Button variant="secondary" disabled={busy} onClick={() => void action("cancel")}>Annuler</Button>}</>}</div></div>
      <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th>Produit</th><th>Théorique au comptage</th><th>Physique</th><th>Écart</th><th>Valeur de l’écart</th></tr></thead><tbody>{inventory.lignes.map((line) => { const delta = difference(line); return <tr key={line.id} className="border-t border-line"><td className="py-3">{line.produitNom}<span className="block text-xs text-muted">{line.produitReference ?? ""}</span></td><td>{line.quantiteTheorique}</td><td><input aria-label={`Quantité comptée ${line.produitNom}`} type="number" min="0" className="w-24 rounded-md border p-2" defaultValue={line.quantiteComptee ?? ""} disabled={inventory.statut !== "IN_PROGRESS"} onBlur={(event) => void count(line, event.target.value)} /></td><td>{delta === null ? <span className="text-muted">Non compté</span> : delta > 0 ? `+${delta}` : delta}</td><td>{delta === null ? "—" : (delta * Number(line.coutUnitaire)).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</td></tr>; })}</tbody></table></div></section>
    </> : <>
      <section className="rounded-xl border border-line bg-white p-5"><h2 className="mb-4 font-semibold">Démarrer une session</h2><div className="grid gap-3 md:grid-cols-2"><label className="text-sm">Boutique<select className="mt-1 w-full rounded-md border p-2" value={storeId} onChange={(e) => setStoreId(e.target.value)}>{stores.map((store) => <option key={store.id} value={store.id}>{store.nom}</option>)}</select></label><label className="text-sm">Libellé<input className="mt-1 w-full rounded-md border p-2" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Inventaire du rayon épicerie" /></label><label className="text-sm">Produits à inclure<select className="mt-1 w-full rounded-md border p-2" value={selection} onChange={(e) => setSelection(e.target.value)}><option value="ALL">Tous les produits actifs</option><option value="CATEGORY">Une catégorie</option><option value="MANUAL">Sélection manuelle</option></select></label>{selection === "CATEGORY" && <label className="text-sm">Catégorie<select className="mt-1 w-full rounded-md border p-2" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}><option value="">Choisir une catégorie…</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.nom}</option>)}</select></label>}{selection === "MANUAL" && <fieldset className="max-h-48 overflow-y-auto rounded-md border p-3 md:col-span-2"><legend className="px-1 text-sm">Produits sélectionnés ({productIds.length})</legend>{products.map((product) => <label key={product.id} className="flex items-center gap-2 py-1 text-sm"><input type="checkbox" checked={productIds.includes(product.id)} onChange={(event) => setProductIds((ids) => event.target.checked ? [...ids, product.id] : ids.filter((id) => id !== product.id))} />{product.nom}{product.reference ? ` · ${product.reference}` : ""}</label>)}</fieldset>}</div><Button className="mt-4" disabled={busy || !storeId || (selection === "CATEGORY" && !categoryId) || (selection === "MANUAL" && productIds.length === 0)} onClick={() => void create()}>Créer l’inventaire</Button></section>
      <section className="rounded-xl border border-line bg-white p-5"><h2 className="mb-3 font-semibold">Historique</h2>{rows.length ? <ul className="divide-y divide-line">{rows.map((row) => <li key={row.id} className="py-3"><Link className="font-medium text-primary" to={`/stock/inventaires/${row.id}`}>{row.reference} · {row.libelle}</Link><p className="text-sm text-muted">{row.boutique.nom} · {row.statut} · {row._count?.lignes ?? ""} produits</p></li>)}</ul> : <p className="text-sm text-muted">Aucun inventaire pour le moment.</p>}</section>
      <p className="text-sm"><Link className="text-primary" to="/stock/pertes">Consulter les pertes et casses →</Link></p>
    </>}
  </main>;
}
