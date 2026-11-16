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
import { PeriodFilter } from "@/components/admin/PeriodFilter";
import { ActivityList, CardLink, OrganizationStatusBadge } from "@/components/admin/parts";
import { formatDate, formatDateTime, formatNumber, formatRelative } from "@/lib/format";

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
  { href: "/admin/statistiques", icon: "chart", label: "Voir les statistiques", hint: "Inscriptions et activité" },
  { href: "/admin/activite", icon: "activity", label: "Consulter l'activité", hint: "Journal de la plateforme" },
] as const;

/**
 * Accueil du super administrateur : comptes, statuts et dernière activité des
 * boutiques. L'activité commerciale des boutiques n'y figure pas.
 */
export default function AdminDashboardPage() {
  const params = useSearchParamsRecord();
  const { user, range, overview, alerts, activity } = useLoaderData<AdminDashboardPageData>();

  const { organizations, users } = overview;
  const periodLabel = RANGE_LABELS[range].toLowerCase();
  const today = formatDate(new Date(), { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const now = new Date();

  return (
    <div>
      <PageHeader
        title={`Bonjour, ${user.prenom}`}
        description={`Vue d'ensemble de la plateforme · ${today}`}
        action={<PeriodFilter basePath="/admin" searchParams={params} range={range} />}
      />

      {organizations.total === 0 ? (
        <Card>
          <EmptyState
            icon="store"
            title="Aucune boutique sur la plateforme"
            description="Dès qu'un commerçant s'inscrit, ou que vous créez une boutique, elle apparaît ici."
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
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard
              label="Boutiques inscrites"
              icon="store"
              value={formatNumber(organizations.total)}
              hint={organizations.created > 0 ? `+${organizations.created} sur ${periodLabel}` : `Aucune inscription sur ${periodLabel}`}
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
              label="Points de vente"
              icon="layers"
              value={formatNumber(overview.stores)}
              hint={`${users.disabled} compte(s) désactivé(s)`}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader
                title="Dernière activité des boutiques"
                description="Date de la dernière opération ou connexion"
                action={<CardLink href="/admin/boutiques?sort=lastActivity&order=desc">Toutes</CardLink>}
              />
              <ul className="divide-y divide-slate-100">
                {overview.recentlyActive.map((row) => (
                  <li key={row.id}>
                    <Link href={`/admin/boutiques/${row.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/70">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200/70">
                        <Icon name="store" className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">{row.name}</span>
                      <span className="shrink-0 text-xs text-slate-500">
                        {row.lastActivity ? (
                          <time dateTime={row.lastActivity} title={formatDateTime(row.lastActivity)}>
                            {formatRelative(row.lastActivity, now)}
                          </time>
                        ) : (
                          "Jamais"
                        )}
                      </span>
                      <OrganizationStatusBadge status={row.status} />
                    </Link>
                  </li>
                ))}
              </ul>
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
        </>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Activité récente" description="Inscriptions et actions d'administration" action={<CardLink href="/admin/activite">Tout voir</CardLink>} />
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
