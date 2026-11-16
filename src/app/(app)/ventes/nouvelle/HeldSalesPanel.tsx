import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { apiFetch } from "@/lib/api";
import { formatDateTime, formatMoney } from "@/lib/format";

export type HeldSale = {
  id: number;
  libelle: string;
  nombreArticles: number;
  totalEstime: string | number;
  creeLe: string;
  creePar: { prenom: string; nom: string };
};

/**
 * Ventes mises en attente dans cette boutique (par n'importe quel caissier).
 * « Reprendre » rouvre la vente ; le panier en cours, s'il y en a un, est
 * lui-même mis en attente pour ne rien perdre.
 */
export function HeldSalesPanel({
  storeId,
  currency,
  version,
  busy,
  onResume,
  onDelete,
}: {
  storeId: number;
  currency: string;
  /** Incrémenté par la page pour relire la liste. */
  version: number;
  busy: boolean;
  onResume: (sale: HeldSale) => void;
  onDelete: (sale: HeldSale) => void;
}) {
  const [sales, setSales] = useState<HeldSale[]>([]);

  useEffect(() => {
    let cancelled = false;
    apiFetch(`/api/held-sales?storeId=${storeId}`)
      .then(async (response) => (response.ok ? ((await response.json()) as { data: HeldSale[] }).data : []))
      .then((data) => !cancelled && setSales(data))
      .catch(() => !cancelled && setSales([]));
    return () => {
      cancelled = true;
    };
  }, [storeId, version]);

  if (sales.length === 0) return null;

  return (
    <section className="mb-4 rounded-xl border border-amber-200/80 bg-amber-50/60 p-3" aria-label="Ventes en attente">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900">
        <Icon name="pause" className="h-4 w-4" />
        {sales.length} vente{sales.length > 1 ? "s" : ""} en attente
      </p>
      <ul className="flex flex-wrap gap-2">
        {sales.map((sale) => (
          <li key={sale.id} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-xs ring-1 ring-amber-200/70">
            <span>
              <span className="font-medium text-slate-900">{sale.libelle}</span>
              <span className="block text-xs text-slate-500">
                {sale.nombreArticles} article{sale.nombreArticles > 1 ? "s" : ""} · {formatMoney(Number(sale.totalEstime), currency)} · {formatDateTime(sale.creeLe)} ·{" "}
                {sale.creePar.prenom}
              </span>
            </span>
            <Button type="button" size="sm" disabled={busy} onClick={() => onResume(sale)}>
              Reprendre
            </Button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onDelete(sale)}
              aria-label={`Supprimer la vente en attente ${sale.libelle}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            >
              <Icon name="trash" className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
