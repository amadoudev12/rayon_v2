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
import { TableContainer, Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueTrendChart } from "@/components/dashboard/RevenueTrendChart";
import { ActivityList, OrganizationStatusBadge } from "@/components/admin/parts";
import { OrganizationStatusButton } from "@/components/admin/StatusActions";
import { formatDate, formatDateTime, formatMoney, formatNumber, formatRelative, initials } from "@/lib/format";
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

/** Vue de supervision d'une boutique, calculée par le backend (`getOrganizationDetails`). */
type OrganizationDetails = {
  id: number;
  nom: string;
  slug: string;
  devise: string;
  actif: boolean;
  creeLe: string;
  lastActivity: string | null;
  status: OrganizationStatus;
  owner: MemberUser | null;
  stores: {
    id: number;
    nom: string;
    adresse: string | null;
    telephone: string | null;
    parDefaut: boolean;
    sales: number;
    members: number;
  }[];
  members: { id: number; role: Role; storeName: string | null; user: MemberUser }[];
  counts: {
    products: number;
    activeProducts: number;
    customers: number;
    suppliers: number;
    purchases: number;
    sales: number;
    cancelledSales: number;
  };
  revenue: { allTime: number; month: number; monthSales: number; averageBasket: number };
  trend: { day: string; value: number; count: number }[];
  recentSales: {
    id: number;
    total: number;
    cancelled: boolean;
    creeLe: string;
    storeName: string;
    seller: string;
    customer: string | null;
  }[];
  topProducts: { id: number; nom: string; unite: string; quantity: number; amount: number }[];
  recentProducts: { id: number; nom: string; prixVente: number; actif: boolean; creeLe: string; categorie: string | null }[];
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

  const { devise: currency, counts, revenue } = organization;
  const now = new Date();
  const trendTotal = organization.trend.reduce((total, point) => total + point.value, 0);

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
              {organization.lastActivity
                ? `dernière activité ${formatRelative(organization.lastActivity, now)}`
                : "aucune activité enregistrée"}
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <OrganizationStatusButton organization={organization} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Chiffre d'affaires"
          icon="coins"
          value={formatMoney(revenue.allTime, currency)}
          hint={`Ce mois-ci : ${formatMoney(revenue.month, currency)}`}
        />
        <StatCard
          label="Ventes"
          icon="receipt"
          value={formatNumber(counts.sales)}
          hint={
            counts.sales > 0
              ? `Panier moyen : ${formatMoney(revenue.averageBasket, currency)} · ${counts.cancelledSales} annulée(s)`
              : "Aucune vente enregistrée"
          }
        />
        <StatCard
          label="Produits"
          icon="box"
          value={formatNumber(counts.products)}
          hint={`${formatNumber(counts.activeProducts)} actif(s) au catalogue`}
        />
        <StatCard
          label="Utilisateurs"
          icon="users"
          value={formatNumber(organization.members.length)}
          hint={`${organization.stores.length} point(s) de vente · ${formatNumber(counts.customers)} client(s)`}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Chiffre d'affaires — 30 derniers jours"
            description={`${formatMoney(trendTotal, currency)} sur la période · ventes annulées exclues`}
          />
          {trendTotal === 0 ? (
            <EmptyState compact icon="chart" title="Aucune vente sur les 30 derniers jours" />
          ) : (
            <div className="px-2 pb-4 pt-2">
              <RevenueTrendChart data={organization.trend} currency={currency} />
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Informations" />
          <dl className="divide-y divide-slate-100 py-1">
            <Field label="Propriétaire">
              {organization.owner ? `${organization.owner.prenom} ${organization.owner.nom}` : "Aucun"}
            </Field>
            <Field label="Email">{organization.owner?.email ?? "—"}</Field>
            <Field label="Téléphone">{organization.owner?.telephone ?? "—"}</Field>
            <Field label="Devise">{currency}</Field>
            <Field label="Identifiant">{organization.slug}</Field>
            <Field label="Fournisseurs">{formatNumber(counts.suppliers)}</Field>
            <Field label="Achats enregistrés">{formatNumber(counts.purchases)}</Field>
          </dl>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
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

        <Card>
          <CardHeader title="Points de vente" description="Chaque point de vente a son stock et ses ventes" />
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
                <p className="tabular shrink-0 text-sm text-slate-600">{formatNumber(store.sales)} vente(s)</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Dernières ventes" description="Consultation seule : les ventes se gèrent depuis la boutique" />
        {organization.recentSales.length === 0 ? (
          <EmptyState compact icon="receipt" title="Aucune vente" description="Cette boutique n'a encore enregistré aucune vente." />
        ) : (
          <TableContainer>
            <Table>
              <Thead>
                <tr>
                  <Th>Vente</Th>
                  <Th>Point de vente</Th>
                  <Th>Vendeur</Th>
                  <Th>Client</Th>
                  <Th>Statut</Th>
                  <Th>Date</Th>
                  <Th className="text-right">Total</Th>
                </tr>
              </Thead>
              <tbody>
                {organization.recentSales.map((sale) => (
                  <Tr key={sale.id}>
                    <Td className="tabular font-medium text-slate-900">#{String(sale.id).padStart(5, "0")}</Td>
                    <Td className="whitespace-nowrap">{sale.storeName}</Td>
                    <Td className="whitespace-nowrap">{sale.seller}</Td>
                    <Td className="whitespace-nowrap">{sale.customer ?? "Client de passage"}</Td>
                    <Td>
                      <Badge dot tone={sale.cancelled ? "danger" : "success"}>
                        {sale.cancelled ? "Annulée" : "Terminée"}
                      </Badge>
                    </Td>
                    <Td className="whitespace-nowrap text-slate-500">{formatDateTime(sale.creeLe)}</Td>
                    <Td
                      className={`tabular whitespace-nowrap text-right font-medium ${
                        sale.cancelled ? "text-slate-400 line-through" : "text-slate-900"
                      }`}
                    >
                      {formatMoney(sale.total, currency)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Meilleures ventes" description="Par quantité, depuis l'inscription" />
          {organization.topProducts.length === 0 ? (
            <EmptyState compact icon="box" title="Aucun produit vendu" />
          ) : (
            <ol className="divide-y divide-slate-100">
              {organization.topProducts.map((product, index) => (
                <li key={product.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="tabular flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-50 text-xs font-semibold text-slate-500 ring-1 ring-inset ring-slate-200/70">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{product.nom}</p>
                      <p className="text-xs text-slate-500">
                        {formatNumber(product.quantity)} {product.unite} vendu(s)
                      </p>
                    </div>
                  </div>
                  <span className="tabular shrink-0 text-sm font-medium text-slate-700">{formatMoney(product.amount, currency)}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card>
          <CardHeader title="Derniers produits ajoutés" description={`${formatNumber(counts.products)} produit(s) au total`} />
          {organization.recentProducts.length === 0 ? (
            <EmptyState compact icon="box" title="Aucun produit" description="Le catalogue de cette boutique est vide." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {organization.recentProducts.map((product) => (
                <li key={product.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <span className="min-w-0 truncate">{product.nom}</span>
                      {!product.actif && <Badge>Archivé</Badge>}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {product.categorie ?? "Sans catégorie"} · ajouté le {formatDate(product.creeLe)}
                    </p>
                  </div>
                  <span className="tabular shrink-0 text-sm text-slate-700">{formatMoney(product.prixVente, currency)}</span>
                </li>
              ))}
            </ul>
          )}
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
