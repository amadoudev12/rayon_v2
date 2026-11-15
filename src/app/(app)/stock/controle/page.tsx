import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";

type StockRow = { id: number; boutiqueId: number; produitId: number; quantite: number; seuilAlerte: number; niveau: "OUT" | "LOW" | "NORMAL"; produit: { nom: string } };
type StockPage = { data: StockRow[]; pagination: { totalPages: number } };
type Alert = { type: "STOCK" | "REPEATED_LOSS"; produitId: number; produit: string; quantite: number; seuilAlerte: number; niveau: "OUT" | "LOW" | "REPEATED_LOSS"; occurrences?: number };

export default function StockControlPage() {
  const [rows, setRows] = useState<StockRow[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [thresholds, setThresholds] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<number | null>(null);

  useEffect(() => {
    void Promise.all([apiFetch("/api/stock?limit=100&page=1"), apiFetch("/api/stock/alerts")])
      .then(async ([stockResponse, alertResponse]) => {
        const first = await stockResponse.json() as StockPage;
        const alertBody = await alertResponse.json() as { data: Alert[]; message?: string };
        if (!stockResponse.ok || !alertResponse.ok) throw new Error(alertBody.message ?? "Chargement impossible.");
        const pages = await Promise.all(Array.from({ length: Math.max(0, first.pagination.totalPages - 1) }, (_, index) => apiFetch(`/api/stock?limit=100&page=${index + 2}`).then((response) => response.json() as Promise<StockPage>)));
        const stockRows = [...first.data, ...pages.flatMap((page) => page.data)];
        setRows(stockRows);
        setAlerts(alertBody.data);
        setThresholds(Object.fromEntries(stockRows.map((row) => [row.produitId, String(row.seuilAlerte)])));
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Chargement impossible."));
  }, []);

  async function save(row: StockRow) {
    setError(""); setSaved(null);
    try {
      const response = await apiFetch("/api/stock/threshold", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ boutiqueId: row.boutiqueId, produitId: row.produitId, seuilAlerte: Number(thresholds[row.produitId]) }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "Modification impossible.");
      setSaved(row.produitId);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Modification impossible."); }
  }

  const stockAlerts = alerts.filter((alert) => alert.type === "STOCK");
  const repeatedLossAlerts = alerts.filter((alert) => alert.type === "REPEATED_LOSS");
  return <main className="space-y-5 p-6">
    <PageHeader title="Alertes et seuils de stock" description="Seuil boutique prioritaire, sinon seuil par défaut du produit." />
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <section className="rounded-xl border border-line bg-white p-5">
      <h2 className="mb-3 font-semibold">Ruptures et stocks faibles</h2>
      {stockAlerts.length ? <table className="w-full text-left text-sm"><thead><tr><th>Produit</th><th>Disponible</th><th>Seuil</th><th>État</th></tr></thead><tbody>{stockAlerts.map((row) => <tr className="border-t border-line" key={row.produitId}><td className="py-3">{row.produit}</td><td>{row.quantite}</td><td>{row.seuilAlerte}</td><td>{row.niveau === "OUT" ? "Rupture" : "Stock faible"}</td></tr>)}</tbody></table> : <p className="text-sm text-muted">Aucune rupture ni stock faible.</p>}
    </section>
    <section className="rounded-xl border border-line bg-white p-5">
      <h2 className="mb-3 font-semibold">Pertes répétées sur 30 jours</h2>
      {repeatedLossAlerts.length ? <table className="w-full text-left text-sm"><thead><tr><th>Produit</th><th>Déclarations actives</th><th>Quantité perdue</th></tr></thead><tbody>{repeatedLossAlerts.map((row) => <tr className="border-t border-line" key={row.produitId}><td className="py-3">{row.produit}</td><td>{row.occurrences}</td><td>{row.quantite}</td></tr>)}</tbody></table> : <p className="text-sm text-muted">Aucune répétition détectée.</p>}
    </section>
    <section className="rounded-xl border border-line bg-white p-5">
      <h2 className="mb-3 font-semibold">Seuils par boutique</h2>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th>Produit</th><th>Stock</th><th>Seuil actif</th><th>Enregistrer</th></tr></thead><tbody>{rows.map((row) => <tr className="border-t border-line" key={row.produitId}><td className="py-3">{row.produit.nom}</td><td>{row.quantite}</td><td><input aria-label={`Seuil ${row.produit.nom}`} className="w-24 rounded-md border p-2" min="0" type="number" value={thresholds[row.produitId] ?? ""} onChange={(event) => setThresholds((old) => ({ ...old, [row.produitId]: event.target.value }))} /></td><td><button className="text-primary" onClick={() => void save(row)}>{saved === row.produitId ? "Enregistré" : "Sauvegarder"}</button></td></tr>)}</tbody></table></div>
    </section>
  </main>;
}
