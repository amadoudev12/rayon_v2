import { StatCard } from "@/components/dashboard/StatCard";
import { Link } from "@/lib/navigation";
import { formatMoney, formatNumber } from "@/lib/format";

/**
 * Chiffres de la période calculés par le backend (`getSalesStats`). Coûts,
 * marge, dépenses et bénéfice valent null pour les rôles qui ne voient pas
 * les rapports.
 */
export type SalesStatsData = {
  salesCount: number;
  revenue: number;
  collected: number;
  collectedOnOlderSales: number;
  creditSales: number;
  creditSalesCount: number;
  outstanding: number;
  outstandingCount: number;
  costOfGoodsSold: number | null;
  grossMargin: number | null;
  expensesTotal: number | null;
  netProfit: number | null;
};

export function SalesStats({ stats, currency }: { stats: SalesStatsData; currency: string }) {
  const money = (value: number) => formatMoney(value, currency);
  const showFinance = stats.grossMargin !== null;

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <StatCard
        label="Ventes"
        icon="receipt"
        value={formatNumber(stats.salesCount)}
        hint={stats.salesCount > 0 ? `Panier moyen ${money(stats.revenue / stats.salesCount)}` : "Aucune vente sur la période"}
      />
      <StatCard label="Chiffre d'affaires" icon="chart" value={money(stats.revenue)} hint="Ventes réalisées, crédits compris" />
      <StatCard
        label="Encaissé"
        icon="wallet"
        value={money(stats.collected)}
        tone="success"
        hint={
          stats.collectedOnOlderSales > 0
            ? `dont ${money(stats.collectedOnOlderSales)} sur d'anciennes créances`
            : "Argent effectivement reçu"
        }
      />
      <StatCard
        label="Ventes à crédit"
        icon="calendar"
        value={money(stats.creditSales)}
        hint={stats.creditSalesCount > 0 ? `${formatNumber(stats.creditSalesCount)} vente(s) sur la période` : "Aucune sur la période"}
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
      {showFinance && (
        <>
          <StatCard
            label="Marge brute"
            icon="trendingUp"
            value={money(stats.grossMargin!)}
            tone={stats.grossMargin! < 0 ? "danger" : "default"}
            hint={`CA − ${money(stats.costOfGoodsSold!)} de coût des marchandises`}
          />
          <StatCard label="Dépenses" icon="wallet" value={money(stats.expensesTotal!)} hint="Dépenses enregistrées sur la période" />
          <StatCard
            label="Bénéfice"
            icon="coins"
            value={money(stats.netProfit!)}
            tone={stats.netProfit! < 0 ? "danger" : "success"}
            hint="Marge brute − dépenses"
          />
        </>
      )}
    </div>
  );
}
