import { StatCard } from "@/components/dashboard/StatCard";
import { Link } from "@/lib/navigation";
import { formatMoney, formatNumber } from "@/lib/format";
import { TENDER_OPTIONS } from "@/lib/labels";

type ByTender = { CASH: number; CARD: number; MOBILE_MONEY: number; OTHER: number; UNKNOWN: number };

/**
 * Chiffres de la période calculés par le backend (`services/finance`, même
 * calcul que le tableau de bord). Coûts, marge, charges, pertes et résultat
 * valent null pour les rôles qui ne voient pas les rapports.
 */
export type SalesStatsData = {
  salesCount: number;
  grossSales: number;
  returns: number;
  returnsCount: number;
  revenue: number;
  collected: number;
  collectedByMethod: ByTender;
  collectedOnOlderSales: number;
  refunded: number;
  refundedByMethod: ByTender;
  netCollected: number;
  pendingRefund: number;
  pendingRefundCount: number;
  creditSales: number;
  creditSalesCount: number;
  outstanding: number;
  outstandingCount: number;
  costOfGoodsSold: number | null;
  grossMargin: number | null;
  grossMarginRate: number | null;
  storeExpenses: number | null;
  generalExpenses: number | null;
  generalExpensesIncluded: boolean;
  expensesTotal: number | null;
  stockLosses: number | null;
  returnLosses: number | null;
  inventoryShortfall: number | null;
  inventorySurplus: number | null;
  lossesTotal: number | null;
  netProfit: number | null;
};

function Row({ label, value, strong = false, tone }: { label: string; value: string; strong?: boolean; tone?: "danger" | "success" }) {
  const color = tone === "danger" ? "text-red-600" : tone === "success" ? "text-emerald-700" : "text-slate-900";
  return (
    <div className={`flex justify-between gap-3 py-1 ${strong ? "border-t border-slate-100 pt-2 font-semibold" : "text-slate-600"}`}>
      <dt>{label}</dt>
      <dd className={`tabular ${strong ? color : ""}`}>{value}</dd>
    </div>
  );
}

export function SalesStats({ stats, currency }: { stats: SalesStatsData; currency: string }) {
  const money = (value: number) => formatMoney(value, currency);
  const showFinance = stats.grossMargin !== null;
  const tenders = TENDER_OPTIONS.filter((option) => stats.collectedByMethod[option.value] > 0 || stats.refundedByMethod[option.value] > 0);

  return (
    <div className="mb-6 space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Chiffre d'affaires net"
          icon="chart"
          value={money(stats.revenue)}
          hint={
            stats.returns > 0
              ? `Ventes ${money(stats.grossSales)} − retours ${money(stats.returns)}`
              : `${formatNumber(stats.salesCount)} vente(s), crédits compris`
          }
        />
        <StatCard
          label="Encaissé net"
          icon="wallet"
          value={money(stats.netCollected)}
          tone="success"
          hint={
            `Reçu ${money(stats.collected)} · rendu ${money(stats.refunded)}` +
            (stats.collectedOnOlderSales > 0 ? ` · dont ${money(stats.collectedOnOlderSales)} sur d'anciennes créances` : "")
          }
        />
        <StatCard
          label="Remboursements à verser"
          icon="wallet"
          value={money(stats.pendingRefund)}
          tone={stats.pendingRefund > 0 ? "warning" : "default"}
          hint={stats.pendingRefundCount > 0 ? `${formatNumber(stats.pendingRefundCount)} remboursement(s) dû(s) aux clients` : "Aucun remboursement en attente"}
        />
        <StatCard
          label="Créances restantes"
          icon="coins"
          value={money(stats.outstanding)}
          tone={stats.outstanding > 0 ? "warning" : "default"}
          hint={
            stats.outstandingCount > 0 ? (
              <Link href="/creances" className="font-medium text-brand-700 hover:underline">
                {formatNumber(stats.outstandingCount)} vente(s) à encaisser, à ce jour →
              </Link>
            ) : (
              "Aucune créance en cours"
            )
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Caisse de la période</h3>
          <dl className="text-sm">
            {tenders.length === 0 && <p className="text-slate-500">Aucun mouvement d'argent sur la période.</p>}
            {tenders.map((option) => (
              <Row
                key={option.value}
                label={option.label}
                value={`${money(stats.collectedByMethod[option.value])} reçus · ${money(stats.refundedByMethod[option.value])} rendus`}
              />
            ))}
            {stats.collectedByMethod.UNKNOWN > 0 && <Row label="Mode non renseigné (historique)" value={money(stats.collectedByMethod.UNKNOWN)} />}
            <Row label="Encaissé net" value={money(stats.netCollected)} strong />
          </dl>
          <p className="mt-2 text-xs text-slate-500">
            Un remboursement n'est compté qu'une fois réellement versé. Ventes à crédit de la période : {money(stats.creditSales)}.
          </p>
        </section>

        {showFinance && (
          <section className="rounded-xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Résultat de la période</h3>
            <dl className="text-sm">
              <Row label="Chiffre d'affaires net" value={money(stats.revenue)} />
              <Row label="− Coût des marchandises vendues" value={money(stats.costOfGoodsSold!)} />
              <Row
                label={`= Marge brute${stats.grossMarginRate !== null ? ` (${stats.grossMarginRate.toFixed(1)} %)` : ""}`}
                value={money(stats.grossMargin!)}
                strong
                tone={stats.grossMargin! < 0 ? "danger" : undefined}
              />
              <Row label={stats.generalExpensesIncluded ? "− Dépenses (boutiques et générales)" : "− Dépenses de la boutique"} value={money(stats.expensesTotal!)} />
              <Row label="− Pertes de stock déclarées" value={money(stats.stockLosses!)} />
              <Row label="− Retours non revendables" value={money(stats.returnLosses!)} />
              <Row label="− Écarts d'inventaire (manquants)" value={money(stats.inventoryShortfall!)} />
              {stats.inventorySurplus! > 0 && <Row label="+ Écarts d'inventaire (excédents)" value={money(stats.inventorySurplus!)} />}
              <Row label="= Résultat net" value={money(stats.netProfit!)} strong tone={stats.netProfit! < 0 ? "danger" : "success"} />
            </dl>
            {!stats.generalExpensesIncluded && stats.generalExpenses! > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                Charges générales de l'organisation ({money(stats.generalExpenses!)}) non imputées à cette boutique : elles figurent dans la vue « toutes boutiques » du tableau de bord.
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
