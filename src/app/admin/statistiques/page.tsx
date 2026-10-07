import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { Link, useSearchParamsRecord } from "@/lib/navigation";
import { loadPage } from "@/lib/api";
import { RANGE_LABELS, type PlatformAnalytics, type PlatformRange } from "@/lib/services/platform";
import { PAYMENT_METHOD_LABELS } from "@/lib/labels";
import type { PaymentMethod } from "@/generated/prisma/enums";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableContainer, Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueTrendChart } from "@/components/dashboard/RevenueTrendChart";
import { SalesCountChart, SignupsChart } from "@/components/admin/PlatformCharts";
import { PeriodFilter } from "@/components/admin/PeriodFilter";
import { OrganizationStatusBadge, ShareBar, Trend } from "@/components/admin/parts";
import { formatMoney, formatNumber, formatPercent } from "@/lib/format";

/** `range` : période lue et validée par le backend. */
type AdminAnalyticsPageData = { range: PlatformRange; analytics: PlatformAnalytics };

export function loader({ request }: LoaderFunctionArgs) {
  return loadPage<AdminAnalyticsPageData>("/admin/statistiques", request);
}

export default function AdminAnalyticsPage() {
  const params = useSearchParamsRecord();
  const { range, analytics } = useLoaderData<AdminAnalyticsPageData>();

  const { currency, revenue, sales } = analytics;
  const periodLabel = RANGE_LABELS[range].toLowerCase();
  const maxMethodCount = Math.max(...analytics.paymentMethods.map((row) => row.count), 0);
  const hasSignups = analytics.signups.some((week) => week.organizations > 0 || week.users > 0);

  return (
    <div>
      <PageHeader
        title="Statistiques"
        description="Ventes, moyens de paiement, inscriptions et performance des boutiques."
        action={
          <PeriodFilter
            basePath="/admin/statistiques"
            searchParams={params}
            range={range}
            currency={currency}
            currencies={analytics.currencies}
          />
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label={`CA · ${RANGE_LABELS[range]}`}
          icon="chart"
          value={formatMoney(revenue.period, currency)}
          hint={<Trend value={revenue.periodChange} label="vs période précédente" fallback="Aucune vente sur la période précédente" />}
        />
        <StatCard
          label="Ventes terminées"
          icon="receipt"
          value={formatNumber(sales.period)}
          hint={<Trend value={sales.periodChange} label="vs période précédente" fallback="Toutes boutiques et devises" />}
        />
        <StatCard
          label="Panier moyen"
          icon="cart"
          value={formatMoney(revenue.averageBasket, currency)}
          hint={`Ventes facturées en ${currency}`}
        />
        <StatCard
          label="Taux d'annulation"
          icon="xCircle"
          value={sales.cancellationRate === null ? "—" : formatPercent(sales.cancellationRate, { signed: false })}
          tone={sales.cancellationRate !== null && sales.cancellationRate >= 10 ? "warning" : "default"}
          hint={`${formatNumber(sales.cancelled)} vente(s) annulée(s) sur ${periodLabel}`}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Évolution du chiffre d'affaires"
            description={`${formatMoney(revenue.period, currency)} sur ${periodLabel}${range === "today" ? " · heures UTC" : ""}`}
          />
          {revenue.period === 0 ? (
            <EmptyState compact icon="chart" title="Aucune vente sur cette période" />
          ) : (
            <div className="px-2 pb-4 pt-2">
              <RevenueTrendChart data={analytics.series} currency={currency} />
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Évolution du nombre de ventes" description={`${formatNumber(sales.period)} vente(s) sur ${periodLabel}`} />
          {sales.period === 0 ? (
            <EmptyState compact icon="receipt" title="Aucune vente sur cette période" />
          ) : (
            <div className="px-2 pb-4 pt-2">
              <SalesCountChart data={analytics.series} />
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Moyens de paiement" description={`Répartition des ventes · ${periodLabel}`} />
          {analytics.paymentMethods.length === 0 ? (
            <EmptyState compact icon="wallet" title="Aucune vente sur cette période" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {analytics.paymentMethods.map((row) => (
                <li key={row.method} className="px-5 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-medium text-slate-900">
                      {PAYMENT_METHOD_LABELS[row.method as PaymentMethod] ?? row.method}
                    </p>
                    <p className="tabular text-sm text-slate-700">
                      {formatNumber(row.count)}
                      <span className="ml-1.5 text-slate-400">
                        {formatPercent((row.count / sales.period) * 100, { signed: false })}
                      </span>
                    </p>
                  </div>
                  <p className="tabular text-xs text-slate-500">{formatMoney(row.revenue, currency)}</p>
                  <ShareBar value={row.count} max={maxMethodCount} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Inscriptions" description="Nouvelles boutiques et nouveaux utilisateurs, par semaine sur 12 semaines" />
          {hasSignups ? (
            <div className="px-2 pb-4 pt-2">
              <SignupsChart data={analytics.signups} />
            </div>
          ) : (
            <EmptyState compact icon="users" title="Aucune inscription sur les 12 dernières semaines" />
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Performance des boutiques" description={`Les 10 boutiques ayant le plus vendu · ${periodLabel}`} />
        {analytics.ranking.length === 0 ? (
          <EmptyState compact icon="store" title="Aucune vente sur cette période" description="Le classement apparaîtra dès la première vente." />
        ) : (
          <TableContainer>
            <Table>
              <Thead>
                <tr>
                  <Th className="w-12">#</Th>
                  <Th>Boutique</Th>
                  <Th>Statut</Th>
                  <Th className="text-right">Ventes</Th>
                  <Th className="text-right">Panier moyen</Th>
                  <Th className="text-right">CA</Th>
                </tr>
              </Thead>
              <tbody>
                {analytics.ranking.map((row, index) => (
                  <Tr key={row.id}>
                    <Td className="tabular text-slate-400">{index + 1}</Td>
                    <Td>
                      <Link href={`/admin/boutiques/${row.id}`} className="font-medium text-slate-900 hover:text-brand-700 hover:underline">
                        {row.name}
                      </Link>
                    </Td>
                    <Td>
                      <OrganizationStatusBadge status={row.status} />
                    </Td>
                    <Td className="tabular text-right">{formatNumber(row.sales)}</Td>
                    <Td className="tabular whitespace-nowrap text-right">{formatMoney(row.averageBasket, row.currency)}</Td>
                    <Td className="tabular whitespace-nowrap text-right font-medium text-slate-900">
                      {formatMoney(row.revenue, row.currency)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </div>
  );
}
