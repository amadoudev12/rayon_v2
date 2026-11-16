import { useEffect, useState } from "react";
import { Link } from "@/lib/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { FormField, inputClass, selectClass } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/ToastProvider";
import { apiFetch } from "@/lib/api";
import { sendJson } from "@/lib/mutation";
import { formatDateTime } from "@/lib/format";
import { ProductPicker, type PickedProduct } from "./ProductPicker";

type Category = { id: number; nom: string };
export type InventorySummary = {
  id: number;
  reference: string;
  libelle: string;
  statut: "DRAFT" | "IN_PROGRESS" | "VALIDATED" | "CANCELLED";
  creeLe: string;
  boutique: { nom: string };
  _count?: { lignes: number };
};

export const INVENTORY_STATUS: Record<InventorySummary["statut"], { label: string; tone: "neutral" | "warning" | "success" | "danger" }> = {
  DRAFT: { label: "Brouillon", tone: "neutral" },
  IN_PROGRESS: { label: "En cours", tone: "warning" },
  VALIDATED: { label: "Validé", tone: "success" },
  CANCELLED: { label: "Annulé", tone: "danger" },
};

async function getData<T>(path: string): Promise<T> {
  const response = await apiFetch(path);
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message ?? "Chargement impossible.");
  return body.data as T;
}

/** Démarrer une session d'inventaire et consulter l'historique, pour la boutique active. */
export function InventoryList() {
  const { push } = useToast();
  const [rows, setRows] = useState<InventorySummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [label, setLabel] = useState("");
  const [selection, setSelection] = useState<"ALL" | "CATEGORY" | "MANUAL">("ALL");
  const [categoryId, setCategoryId] = useState("");
  const [picked, setPicked] = useState<PickedProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getData<InventorySummary[]>("/api/inventories"), getData<Category[]>("/api/categories")])
      .then(([inventories, categoryRows]) => {
        if (cancelled) return;
        setRows(inventories);
        setCategories(categoryRows);
      })
      .catch((cause: unknown) => !cancelled && setError(cause instanceof Error ? cause.message : "Chargement impossible."));
    return () => {
      cancelled = true;
    };
  }, [version]);

  const canCreate = (selection !== "CATEGORY" || Boolean(categoryId)) && (selection !== "MANUAL" || picked.length > 0);

  async function create() {
    setBusy(true);
    setError(null);
    // Boutique : celle du sélecteur (le serveur la lit dans la session du site).
    const result = await sendJson("/api/inventories", {
      libelle: label.trim() || "Inventaire physique",
      selectionType: selection,
      ...(selection === "CATEGORY" ? { categorieId: Number(categoryId) } : {}),
      ...(selection === "MANUAL" ? { produitIds: picked.map((product) => product.id) } : {}),
    });
    setBusy(false);
    if (!result.ok) return setError(result.message);
    push("Inventaire démarré : quantités théoriques figées", "success");
    setLabel("");
    setPicked([]);
    setVersion((value) => value + 1);
  }

  return (
    <div className="space-y-6">
      {error && <Alert>{error}</Alert>}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-slate-900">Démarrer une session</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Un seul inventaire peut être en cours à la fois sur un même produit. Les ventes et achats faits pendant le comptage sont pris en compte à la validation.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <FormField label="Libellé" htmlFor="inventoryLabel">
            <input id="inventoryLabel" value={label} onChange={(event) => setLabel(event.target.value)} className={inputClass} placeholder="Inventaire du rayon épicerie" />
          </FormField>
          <FormField label="Produits à inclure" htmlFor="inventorySelection">
            <select id="inventorySelection" value={selection} onChange={(event) => setSelection(event.target.value as typeof selection)} className={selectClass}>
              <option value="ALL">Tous les produits actifs</option>
              <option value="CATEGORY">Une catégorie</option>
              <option value="MANUAL">Sélection manuelle</option>
            </select>
          </FormField>
          {selection === "CATEGORY" && (
            <FormField label="Catégorie" htmlFor="inventoryCategory">
              <select id="inventoryCategory" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className={selectClass}>
                <option value="">Choisir une catégorie…</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nom}
                  </option>
                ))}
              </select>
            </FormField>
          )}
          {selection === "MANUAL" && (
            <div className="md:col-span-2">
              <ProductPicker selected={picked} onChange={setPicked} />
            </div>
          )}
        </div>
        <Button className="mt-4" loading={busy} disabled={!canCreate} onClick={() => void create()}>
          Créer l&apos;inventaire
        </Button>
      </Card>

      <Card>
        <h2 className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-900">Historique</h2>
        {rows.length === 0 ? (
          <p className="px-5 py-4 text-sm text-slate-500">Aucun inventaire pour le moment.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                <div>
                  <Link href={`/stock/inventaires/${row.id}`} className="text-sm font-medium text-brand-700 hover:underline">
                    {row.reference} · {row.libelle}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {row.boutique.nom} · {row._count?.lignes ?? 0} produit(s) · {formatDateTime(row.creeLe)}
                  </p>
                </div>
                <Badge dot tone={INVENTORY_STATUS[row.statut].tone}>
                  {INVENTORY_STATUS[row.statut].label}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <p className="text-sm">
        <Link href="/stock/pertes" className="font-medium text-brand-700 hover:underline">
          Consulter les pertes et casses →
        </Link>
      </p>
    </div>
  );
}
