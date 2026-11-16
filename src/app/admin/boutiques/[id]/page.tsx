import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { Link } from "@/lib/navigation";
import { loadPage } from "@/lib/api";
import { reviveEvents, type ActivityEventJson, type OrganizationStatus } from "@/lib/services/platform";
import type { Role } from "@/generated/prisma/enums";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { ActivityList, OrganizationStatusBadge } from "@/components/admin/parts";
import { OrganizationStatusButton } from "@/components/admin/StatusActions";
import { formatDate, formatDateTime, formatRelative, initials } from "@/lib/format";
import { userContact } from "@/lib/auth/identifier";

type MemberUser = {
  id: number;
  prenom: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  actif: boolean;
  derniereActiviteLe: string | null;
  creeLe: string;
};

/**
 * Fiche de supervision d'une boutique (`getOrganizationDetails`) : comptes,
 * points de vente, statut et dernière activité. Le super administrateur ne
 * voit pas l'activité commerciale (ventes, produits, clients, montants).
 */
type OrganizationDetails = {
  id: number;
  nom: string;
  slug: string;
  actif: boolean;
  creeLe: string;
  lastActivity: string | null;
  status: OrganizationStatus;
  owner: MemberUser | null;
  stores: { id: number; nom: string; adresse: string | null; telephone: string | null; parDefaut: boolean; members: number }[];
  members: { id: number; role: Role; storeName: string | null; user: MemberUser }[];
  activity: ActivityEventJson[];
};

/** Identifiant invalide ou boutique inconnue : le backend répond 404, la page « introuvable » s'affiche. */
export function loader({ params }: LoaderFunctionArgs) {
  return loadPage<OrganizationDetails>(`/admin/boutiques/${encodeURIComponent(params.id ?? "")}`);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-5 py-2.5 text-sm">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="min-w-0 truncate text-right font-medium text-slate-900">{children}</dd>
    </div>
  );
}

export default function AdminOrganizationPage() {
  const organization = useLoaderData<OrganizationDetails>();
  const now = new Date();

  return (
    <div>
      <Link
        href="/admin/boutiques"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-900"
      >
        <Icon name="arrowLeft" className="h-3.5 w-3.5" />
        Toutes les boutiques
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-base font-semibold text-white shadow-xs ring-1 ring-inset ring-white/10">
            {organization.nom.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{organization.nom}</h1>
              <OrganizationStatusBadge status={organization.status} />
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              Inscrite le {formatDate(organization.creeLe, { dateStyle: "long" })} ·{" "}
              {organization.lastActivity ? (
                <time dateTime={organization.lastActivity} title={formatDateTime(organization.lastActivity)}>
                  dernière activité {formatRelative(organization.lastActivity, now)}
                </time>
              ) : (
                "aucune activité enregistrée"
              )}
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <OrganizationStatusButton organization={organization} />
        </div>
      </div>

      <p className="mb-6 flex items-start gap-2 rounded-lg border border-slate-200/80 bg-slate-50 px-4 py-3 text-xs text-slate-600">
        <Icon name="info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
        L&apos;activité commerciale de la boutique (ventes, produits, clients, montants) reste confidentielle : elle n&apos;est visible que
        par ses membres.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Informations" />
          <dl className="divide-y divide-slate-100 py-1">
            <Field label="Propriétaire">{organization.owner ? `${organization.owner.prenom} ${organization.owner.nom}` : "Aucun"}</Field>
            <Field label="Email">{organization.owner?.email ?? "—"}</Field>
            <Field label="Téléphone">{organization.owner?.telephone ?? "—"}</Field>
            <Field label="Identifiant">{organization.slug}</Field>
            <Field label="Points de vente">{organization.stores.length}</Field>
            <Field label="Membres">{organization.members.length}</Field>
          </dl>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Utilisateurs" description={`${organization.members.length} membre(s) dans cette boutique`} />
          {organization.members.length === 0 ? (
            <EmptyState compact icon="users" title="Aucun membre" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {organization.members.map((member) => (
                <li key={member.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200/70">
                    {initials(member.user.prenom, member.user.nom)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <span className="min-w-0 truncate">
                        {member.user.prenom} {member.user.nom}
                      </span>
                      {!member.user.actif && (
                        <Badge dot tone="danger">
                          Désactivé
                        </Badge>
                      )}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {userContact(member.user)}
                      {member.storeName ? ` · ${member.storeName}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge tone="brand">{ROLE_LABELS[member.role]}</Badge>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {member.user.derniereActiviteLe ? `vu ${formatRelative(member.user.derniereActiviteLe, now)}` : "jamais connecté"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Points de vente" />
          <ul className="divide-y divide-slate-100">
            {organization.stores.map((store) => (
              <li key={store.id} className="flex items-center gap-3 px-5 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200/70">
                  <Icon name="store" className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium text-slate-900">
                    <span className="min-w-0 truncate">{store.nom}</span>
                    {store.parDefaut && <Badge>Principal</Badge>}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {[store.adresse, store.telephone].filter(Boolean).join(" · ") || "Adresse non renseignée"}
                  </p>
                </div>
                <p className="tabular shrink-0 text-sm text-slate-600">{store.members} membre(s)</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Historique"
            action={
              <Link
                href={`/admin/activite?organizationId=${organization.id}`}
                className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700"
              >
                Tout voir
                <Icon name="arrowRight" className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <ActivityList
            events={reviveEvents(organization.activity)}
            linkOrganizations={false}
            emptyDescription="Aucun événement enregistré pour cette boutique."
          />
        </Card>
      </div>
    </div>
  );
}
