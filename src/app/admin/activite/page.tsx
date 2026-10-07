import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { Link } from "@/lib/navigation";
import { loadPage } from "@/lib/api";
import {
  ACTIVITY_KINDS,
  ACTIVITY_KIND_LABELS,
  reviveEvents,
  type ActivityEventJson,
  type ActivityKind,
} from "@/lib/services/platform";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { SelectFilter } from "@/components/ui/SelectFilter";
import { Icon } from "@/components/ui/Icon";
import { ActivityList } from "@/components/admin/parts";

type AdminActivityPageData = {
  activity: { events: ActivityEventJson[]; nextBefore: string | null };
  organization: { id: number; nom: string } | null;
  /** Filtres lus et validés par le backend. */
  kind: ActivityKind | null;
  organizationId: number | null;
  before: string | null;
};

export function loader({ request }: LoaderFunctionArgs) {
  return loadPage<AdminActivityPageData>("/admin/activite", request);
}

const KIND_OPTIONS = ACTIVITY_KINDS.map((kind) => ({ value: kind, label: ACTIVITY_KIND_LABELS[kind] }));
const PAGE_LINK =
  "inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] font-medium text-slate-700 shadow-xs transition-colors hover:border-slate-300 hover:bg-slate-50";

export default function AdminActivityPage() {
  const { activity, organization, ...query } = useLoaderData<AdminActivityPageData>();

  /** Lien conservant les filtres courants, avec ou sans curseur. */
  function hrefWith(before: string | null) {
    const next = new URLSearchParams();
    if (query.kind) next.set("kind", query.kind);
    if (query.organizationId) next.set("organizationId", String(query.organizationId));
    if (before) next.set("before", new Date(before).toISOString());
    const queryString = next.toString();
    return queryString ? `/admin/activite?${queryString}` : "/admin/activite";
  }

  return (
    <div>
      <PageHeader
        title="Activité"
        description={
          organization
            ? `Événements de la boutique « ${organization.nom} », du plus récent au plus ancien.`
            : "Tous les événements de la plateforme, du plus récent au plus ancien."
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <SelectFilter paramName="kind" options={KIND_OPTIONS} placeholder="Tous les événements" />
          {organization && (
            <Link
              href={query.kind ? `/admin/activite?kind=${query.kind}` : "/admin/activite"}
              className="inline-flex items-center gap-1.5 self-start rounded-md bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-200/70 transition-colors hover:bg-brand-100 sm:self-auto"
            >
              {organization.nom}
              <Icon name="x" className="h-3 w-3" />
              <span className="sr-only">Retirer le filtre de boutique</span>
            </Link>
          )}
        </div>

        <ActivityList
          events={reviveEvents(activity.events)}
          emptyDescription={
            query.before ? "Vous avez atteint le début de l'historique." : "Aucun événement ne correspond à ce filtre."
          }
        />

        {(query.before || activity.nextBefore) && (
          <nav aria-label="Pagination" className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
            {query.before ? (
              <Link href={hrefWith(null)} className={PAGE_LINK}>
                <Icon name="chevronLeft" className="h-3.5 w-3.5" />
                Plus récents
              </Link>
            ) : (
              <span />
            )}
            {activity.nextBefore && (
              <Link href={hrefWith(activity.nextBefore)} className={PAGE_LINK}>
                Plus anciens
                <Icon name="chevronRight" className="h-3.5 w-3.5" />
              </Link>
            )}
          </nav>
        )}
      </Card>
    </div>
  );
}
