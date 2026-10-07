import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { Link, useSearchParamsRecord } from "@/lib/navigation";
import { loadPage } from "@/lib/api";
import {
  INACTIVITY_DAYS,
  RANGE_LABELS,
  reviveEvents,
  type ActivityEventJson,
  type PlatformAlert,
  type PlatformOverview,
  type PlatformRange,
} from "@/lib/services/platform";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueTrendChart } from "@/components/dashboard/RevenueTrendChart";
import { SalesCountChart } from "@/components/admin/PlatformCharts";
import { PeriodFilter } from "@/components/admin/PeriodFilter";
import { ActivityList, CardLink, ShareBar, Trend } from "@/components/admin/parts";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";

type AdminDashboardPageData = {
  user: { prenom: string };
  /** Période lue et validée par le backend. */
  range: PlatformRange;
  overview: PlatformOverview;
  alerts: PlatformAlert[];
  activity: { events: ActivityEventJson[]; nextBefore: string | null };
};

export function loader({ request }: LoaderFunctionArgs) {
  return loadPage<AdminDashboardPageData>("/admin", request);
}

const ALERT_ICON = {
  warning: "bg-amber-50 text-amber-600 ring-amber-200/70",
  danger: "bg-red-50 text-red-500 ring-red-200/60",
  neutral: "bg-slate-50 text-slate-500 ring-slate-200/70",
} as const;

const QUICK_ACTIONS = [
  { href: "/admin/boutiques?new=1", icon: "plus", label: "Ajouter une boutique", hint: "Organisation + compte propriétaire" },
  { href: "/admin/boutiques", icon: "store", label: "Voir les boutiques", hint: "Recherche, statut, suspension" },
  { href: "/admin/utilisateurs", icon: "users", label: "Voir les utilisateurs", hint: "Rôles et accès" },
  { href: "/admin/statistiques", icon: "chart", label: "Voir les statistiques", hint: "Ventes et performance" },
  { href: "/admin/activite", icon: "activity", label: "Consulter l'activité", hint: "Journal de la plateforme" },
] as const;

export default function AdminDashboardPage() {
  const params = useSearchParamsRecord();
  const { user, range, overview, alerts, activity } = useLoaderData<AdminDashboardPageData>();

  const { currency, organizations, users, revenue, sales } = overview;
  const periodLabel = RANGE_LABELS[range].toLowerCase();
  const today = formatDate(new Date(), { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const maxTopSales = Math.max(...overview.topOrganizations.map((row) => row.sales), 0);
  const maxTopQuantity = Math.max(...overview.topProducts.map((row) => row.quantity), 0);
  // Les montants ne s'additionnent pas d'une devise à l'autre : on le rappelle
  // dès qu'une partie des boutiques facture dans une autre devise.
  const currencyNote =
    overview.currencies.length > 1 ? `${revenue.organizations} boutique(s) en ${currency}` : "Toutes les boutiques";

  return (
    <div>
      <PageHeader
        title={`Bonjour, ${user.prenom}`}
        description={`Vue d'ensemble de la plateforme · ${today}`}
        action={
          <PeriodFilter
            basePath="/admin"
            searchParams={params}
            range={range}
            currency={currency}
            currencies={overview.currencies}
          />
        }
      />

      {organizations.total === 0 ? (
        <Card>
          <EmptyState
            icon="store"
            title="Aucune boutique sur la plateforme"
            description="Dès qu'un commerçant s'inscrit, ou que vous créez une boutique, ses chiffres apparaissent ici."
            action={
              <LinkButton href="/admin/boutiques?new=1">
                <Icon name="plus" className="h-4 w-4" />
                Ajouter une boutique
              </LinkButton>
            }
          />
        </Card>
      ) : (
        <>
          {/* Taille de la plateforme. */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard
              label="Boutiques inscrites"
              icon="store"
              value={formatNumber(organizations.total)}
              hint={
                organizations.created > 0
                  ? `+${organizations.created} sur ${periodLabel} · ${formatNumber(overview.stores)} point(s) de vente`
                  : `Aucune inscription sur ${periodLabel}`
              }
            />
            <StatCard
              label="Boutiques actives"
              icon="activity"
              value={formatNumber(organizations.active)}
              tone={organizations.active === 0 ? "warning" : "default"}
              hint={`${organizations.inactive} inactive(s) · ${organizations.suspended} suspendue(s) · sur ${INACTIVITY_DAYS} j`}
            />
            <StatCard
              label="Utilisateurs"
              icon="users"
              value={formatNumber(users.total)}
              hint={`${formatNumber(users.active)} actif(s) sur ${INACTIVITY_DAYS} j · +${users.created} sur ${periodLabel}`}
            />
            <StatCard
              label="Produits gérés"
              icon="box"
              value={formatNumber(overview.products)}
              hint="Produits actifs, toutes boutiques"
            />
          </div>

          {/* Volume d'affaires. */}
          <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-4 sm:gap-4 xl:grid-cols-4">
            <StatCard
              label={`CA · ${RANGE_LABELS[range]}`}
              icon="chart"
              value={formatMoney(revenue.period, currency)}
              hint={<Trend value={revenue.periodChange} label="vs période précédente" fallback="Aucune vente sur la période précédente" />}
            />
            <StatCard
              label="CA du mois"
              icon="calendar"
              value={formatMoney(revenue.month, currency)}
              hint={<Trend value={revenue.monthChange} label="vs mois dernier, même durée" fallback={`Aujourd'hui : ${formatMoney(revenue.today, currency)}`} />}
            />
            <StatCard
              label="CA global"
              icon="coins"
              value={formatMoney(revenue.allTime, currency)}
              hint={`Depuis le lancement · ${currencyNote}`}
            />
            <StatCard
              label={`Ventes · ${RANGE_LABELS[range]}`}
              icon="receipt"
              value={formatNumber(sales.period)}
              hint={<Trend value={sales.periodChange} label={`· ${formatNumber(sales.allTime)} au total`} fallback={`${formatNumber(sales.allTime)} vente(s) au total · ${sales.today} aujourd'hui`} />}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader
                title={`Chiffre d'affaires — ${periodLabel}`}
                description={`${formatMoney(revenue.period, currency)} · ventes annulées exclues${range === "today" ? " · heures UTC" : ""}`}
              />
              {revenue.period === 0 ? (
                <EmptyState compact icon="chart" title="Aucune vente sur cette période" description="Élargissez la période pour voir l'évolution." />
              ) : (
                <div className="px-2 pb-4 pt-2">
                  <RevenueTrendChart data={overview.series} currency={currency} />
                </div>
              )}
            </Card>

            <Card>
              <CardHeader title="À surveiller" description={alerts.length > 0 ? "Points nécessitant votre attention" : undefined} />
              {alerts.length === 0 ? (
                <EmptyState compact icon="checkCircle" title="Rien à signaler" description="Aucune boutique inactive, suspendue ou en attente." />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {alerts.map((alert) => (
                    <li key={alert.key}>
                      <Link href={alert.href} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/70">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${ALERT_ICON[alert.tone]}`}>
                          <Icon name={alert.key === "suspended" ? "ban" : alert.key === "onboarding" ? "user" : "alert"} className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-slate-900">{alert.title}</span>
                          <span className="block text-xs text-slate-500">{alert.description}</span>
                        </span>
                        <Icon name="chevronRight" className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-slate-500" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader
                title={`Nombre de ventes — ${periodLabel}`}
                description={`${formatNumber(sales.period)} vente(s) terminée(s), toutes boutiques et devises`}
              />
              {sales.period === 0 ? (
                <EmptyState compact icon="receipt" title="Aucune vente sur cette période" />
              ) : (
                <div className="px-2 pb-4 pt-2">
                  <SalesCountChart data={overview.series} />
                </div>
              )}
            </Card>

            <Card>
              <CardHeader title="État des boutiques" description={`Activité sur ${INACTIVITY_DAYS} jours`} action={<CardLink href="/admin/boutiques">Gérer</CardLink>} />
              <div className="px-5 py-4">
                <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100" aria-hidden>
                  {organizations.active > 0 && <div className="bg-emerald-500" style={{ flexGrow: organizations.active }} />}
                  {organizations.inactive > 0 && <div className="bg-amber-400" style={{ flexGrow: organizations.inactive }} />}
                  {organizations.suspended > 0 && <div className="bg-red-400" style={{ flexGrow: organizations.suspended }} />}
                </div>
                <ul className="mt-4 space-y-1">
                  {[
                    { label: "Actives", value: organizations.active, dot: "bg-emerald-500", href: "/admin/boutiques?status=active" },
                    { label: "Inactives", value: organizations.inactive, dot: "bg-amber-400", href: "/admin/boutiques?status=inactive" },
                    { label: "Suspendues", value: organizations.suspended, dot: "bg-red-400", href: "/admin/boutiques?status=suspended" },
                  ].map((row) => (
                    <li key={row.label}>
                      <Link href={row.href} className="-mx-2 flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-slate-50">
                        <span className="flex items-center gap-2 text-slate-600">
                          <span className={`h-2 w-2 rounded-full ${row.dot}`} aria-hidden />
                          {row.label}
                        </span>
                        <span className="tabular font-medium text-slate-900">
                          {row.value}
                          <span className="ml-1.5 font-normal text-slate-400">
                            {Math.round((row.value / organizations.total) * 100)} %
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Boutiques les plus actives"
                description={`Par nombre de ventes · ${periodLabel}`}
                action={<CardLink href={`/admin/statistiques?range=${range}`}>Classement</CardLink>}
              />
              {overview.topOrganizations.length === 0 ? (
                <EmptyState compact icon="store" title="Aucune vente sur cette période" />
              ) : (
                <ol className="divide-y divide-slate-100">
                  {overview.topOrganizations.map((row, index) => (
                    <li key={row.id}>
                      <Link href={`/admin/boutiques/${row.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/70">
                        <span className="tabular flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-50 text-xs font-semibold text-slate-500 ring-1 ring-inset ring-slate-200/70">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-3">
                            <p className="truncate text-sm font-medium text-slate-900">{row.name}</p>
                            <p className="tabular shrink-0 text-sm font-medium text-slate-700">{formatMoney(row.revenue, row.currency)}</p>
                          </div>
                          <p className="text-xs text-slate-500">{formatNumber(row.sales)} vente(s)</p>
                          <ShareBar value={row.sales} max={maxTopSales} />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </Card>

            <Card>
              <CardHeader title="Produits les plus vendus" description={`Par quantité vendue · ${periodLabel}`} />
              {overview.topProducts.length === 0 ? (
                <EmptyState compact icon="box" title="Aucune vente sur cette période" />
              ) : (
                <ol className="divide-y divide-slate-100">
                  {overview.topProducts.map((row, index) => (
                    <li key={row.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="tabular flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-50 text-xs font-semibold text-slate-500 ring-1 ring-inset ring-slate-200/70">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="truncate text-sm font-medium text-slate-900">{row.name}</p>
                          <p className="tabular shrink-0 text-sm font-medium text-slate-700" title="Montant des lignes, avant remise globale">
                            {formatMoney(row.amount, row.currency)}
                          </p>
                        </div>
                        <p className="truncate text-xs text-slate-500">
                          {formatNumber(row.quantity)} {row.unit} · {row.organization}
                        </p>
                        <ShareBar value={row.quantity} max={maxTopQuantity} />
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>
        </>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Activité récente" description="Derniers événements de la plateforme" action={<CardLink href="/admin/activite">Tout voir</CardLink>} />
          <ActivityList events={reviveEvents(activity.events)} />
        </Card>

        <Card>
          <CardHeader title="Actions rapides" />
          <ul className="p-2">
            {QUICK_ACTIONS.map((action) => (
              <li key={action.href}>
                <Link href={action.href} className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-50">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200/70 transition-colors group-hover:bg-brand-50 group-hover:text-brand-600 group-hover:ring-brand-200/70">
                    <Icon name={action.icon} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-slate-900">{action.label}</span>
                    <span className="block truncate text-xs text-slate-500">{action.hint}</span>
                  </span>
                  <Icon name="arrowRight" className="h-4 w-4 shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-slate-500" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
