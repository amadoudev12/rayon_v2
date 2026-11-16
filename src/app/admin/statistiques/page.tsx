import { useLoaderData } from "react-router";
import { loadPage } from "@/lib/api";
import { INACTIVITY_DAYS, type ActivityBuckets, type PlatformAnalytics } from "@/lib/services/platform";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SignupsChart } from "@/components/admin/PlatformCharts";
import { ShareBar } from "@/components/admin/parts";
import { formatNumber } from "@/lib/format";

type AdminAnalyticsPageData = { analytics: PlatformAnalytics };

export function loader() {
  return loadPage<AdminAnalyticsPageData>("/admin/statistiques");
}

const BUCKETS: { key: keyof ActivityBuckets; label: string }[] = [
  { key: "today", label: "Dans les dernières 24 h" },
  { key: "week", label: "Dans les 7 derniers jours" },
  { key: "month", label: `Dans les ${INACTIVITY_DAYS} derniers jours` },
  { key: "older", label: `Il y a plus de ${INACTIVITY_DAYS} jours` },
  { key: "never", label: "Jamais" },
];

/** Répartition par ancienneté de la dernière activité. */
function ActivityBreakdown({ buckets, unit }: { buckets: ActivityBuckets; unit: string }) {
  const total = BUCKETS.reduce((sum, bucket) => sum + buckets[bucket.key], 0);
  if (total === 0) return <EmptyState compact icon="activity" title={`Aucun ${unit}`} />;
  const max = Math.max(...BUCKETS.map((bucket) => buckets[bucket.key]));
  return (
    <ul className="space-y-3 px-5 py-4">
      {BUCKETS.map((bucket) => (
        <li key={bucket.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-slate-600">{bucket.label}</span>
            <span className="tabular font-medium text-slate-900">
              {formatNumber(buckets[bucket.key])}
              <span className="ml-1.5 font-normal text-slate-400">{Math.round((buckets[bucket.key] / total) * 100)} %</span>
            </span>
          </div>
          <ShareBar value={buckets[bucket.key]} max={max} />
        </li>
      ))}
    </ul>
  );
}

/**
 * Statistiques d'usage de la plateforme : inscriptions et dernières activités.
 * Aucune donnée commerciale des boutiques n'est affichée.
 */
export default function AdminAnalyticsPage() {
  const { analytics } = useLoaderData<AdminAnalyticsPageData>();
  const hasSignups = analytics.signups.some((week) => week.organizations > 0 || week.users > 0);

  return (
    <div>
      <PageHeader
        title="Statistiques"
        description="Inscriptions et activité des comptes. L'activité commerciale des boutiques reste confidentielle."
      />

      <Card>
        <CardHeader title="Inscriptions" description="Nouvelles boutiques et nouveaux utilisateurs, par semaine (12 semaines)" />
        {hasSignups ? (
          <div className="px-2 pb-4 pt-2">
            <SignupsChart data={analytics.signups} />
          </div>
        ) : (
          <EmptyState compact icon="users" title="Aucune inscription sur 12 semaines" />
        )}
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Dernière activité des boutiques" description="Boutiques non suspendues" />
          <ActivityBreakdown buckets={analytics.organizationActivity} unit="boutique" />
        </Card>
        <Card>
          <CardHeader title="Dernière connexion des utilisateurs" description="Comptes actifs" />
          <ActivityBreakdown buckets={analytics.userActivity} unit="utilisateur" />
        </Card>
      </div>
    </div>
  );
}
