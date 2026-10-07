import { Link } from "@/lib/navigation";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime, formatMoney, formatPercent, formatRelative } from "@/lib/format";
import type { ActivityEvent, OrganizationStatus } from "@/lib/services/platform";

/** Variation par rapport à la période précédente : verte en hausse, rouge en baisse. */
export function Trend({ value, label, fallback }: { value: number | null; label: string; fallback: string }) {
  if (value === null) return <>{fallback}</>;
  return (
    <>
      <span className={`inline-flex items-center gap-0.5 font-medium ${value >= 0 ? "text-emerald-600" : "text-red-600"}`}>
        <Icon name={value >= 0 ? "trendingUp" : "trendingDown"} className="h-3 w-3" />
        {formatPercent(value)}
      </span>{" "}
      {label}
    </>
  );
}

const ORGANIZATION_STATUS = {
  active: { label: "Active", tone: "success" },
  inactive: { label: "Inactive", tone: "warning" },
  suspended: { label: "Suspendue", tone: "danger" },
} as const;

export function OrganizationStatusBadge({ status }: { status: OrganizationStatus }) {
  return (
    <Badge dot tone={ORGANIZATION_STATUS[status].tone}>
      {ORGANIZATION_STATUS[status].label}
    </Badge>
  );
}

/** Lien « voir tout » placé dans l'en-tête d'une carte. */
export function CardLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700">
      {children}
      <Icon name="arrowRight" className="h-3.5 w-3.5" />
    </Link>
  );
}

/** Barre de proportion discrète sous une ligne de classement. */
export function ShareBar({ value, max }: { value: number; max: number }) {
  const width = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-100" aria-hidden>
      <div className="h-full rounded-full bg-brand-500/80" style={{ width: `${width}%` }} />
    </div>
  );
}

const EVENT_TONES = {
  brand: "bg-brand-50 text-brand-600 ring-brand-200/60",
  success: "bg-emerald-50 text-emerald-600 ring-emerald-200/60",
  danger: "bg-red-50 text-red-500 ring-red-200/60",
  warning: "bg-amber-50 text-amber-600 ring-amber-200/70",
  neutral: "bg-slate-50 text-slate-500 ring-slate-200/70",
} as const;

/** Flux d'événements de la plateforme (page d'accueil, page Activité, détail d'une boutique). */
export function ActivityList({
  events,
  linkOrganizations = true,
  emptyDescription = "Les inscriptions, ventes et actions d'administration apparaîtront ici.",
}: {
  events: ActivityEvent[];
  /** Faux sur la page d'une boutique : inutile de lier vers la page où l'on est déjà. */
  linkOrganizations?: boolean;
  emptyDescription?: string;
}) {
  if (events.length === 0) {
    return <EmptyState compact icon="history" title="Aucune activité" description={emptyDescription} />;
  }

  const now = new Date();
  return (
    <ul className="divide-y divide-slate-100">
      {events.map((event) => (
        <li key={event.id} className="flex items-center gap-3 px-5 py-3">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${EVENT_TONES[event.tone]}`}
          >
            <Icon name={event.icon} className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">
              {linkOrganizations && event.organization ? (
                <Link href={`/admin/boutiques/${event.organization.id}`} className="hover:text-brand-700 hover:underline">
                  {event.title}
                </Link>
              ) : (
                event.title
              )}
            </p>
            <p className="truncate text-xs text-slate-500">
              <time dateTime={event.date.toISOString()} title={formatDateTime(event.date)}>
                {formatRelative(event.date, now)}
              </time>{" "}
              · {event.subtitle}
            </p>
          </div>
          {event.amount && (
            <span
              className={`tabular shrink-0 text-sm font-semibold ${
                event.amount.cancelled ? "text-slate-400 line-through" : "text-slate-900"
              }`}
            >
              {formatMoney(event.amount.value, event.amount.currency)}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
