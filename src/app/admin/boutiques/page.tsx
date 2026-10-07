import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { loadPage } from "@/lib/api";
import { useSearchParamsRecord } from "@/lib/navigation";
import { INACTIVITY_DAYS, type OrganizationStatus } from "@/lib/services/platform";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";
import { SelectFilter } from "@/components/ui/SelectFilter";
import { Pagination } from "@/components/ui/Pagination";
import { formatRelative } from "@/lib/format";
import { OrganizationsTable } from "./OrganizationsTable";
import { NewOrganizationButton } from "./NewOrganizationButton";

/** Boutique de la liste, calculée par le backend (`listOrganizations`). */
type OrganizationListItem = {
  id: number;
  nom: string;
  devise: string;
  actif: boolean;
  creeLe: string;
  owner: { prenom: string; nom: string; email: string | null; telephone: string | null } | null;
  stores: number;
  members: number;
  products: number;
  sales: number;
  revenue: number;
  lastActivity: string | null;
  status: OrganizationStatus;
};

type AdminOrganizationsPageData = {
  items: OrganizationListItem[];
  total: number;
  filtered: boolean;
  page: number;
  totalPages: number;
};

export function loader({ request }: LoaderFunctionArgs) {
  return loadPage<AdminOrganizationsPageData>("/admin/boutiques", request);
}

const STATUS_OPTIONS = [
  { value: "active", label: "Actives" },
  { value: "inactive", label: "Inactives" },
  { value: "suspended", label: "Suspendues" },
  { value: "nosales", label: "Sans aucune vente" },
];

export default function AdminOrganizationsPage() {
  const params = useSearchParamsRecord();
  const { items, total, filtered, page, totalPages } = useLoaderData<AdminOrganizationsPageData>();
  const now = new Date();

  return (
    <div>
      <PageHeader
        title="Boutiques"
        description={`${total} boutique(s) · « inactive » = aucune activité depuis ${INACTIVITY_DAYS} jours.`}
        action={<NewOrganizationButton defaultOpen={params.new === "1"} />}
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <SearchInput placeholder="Rechercher une boutique, un propriétaire, un email, un téléphone…" />
          <SelectFilter paramName="status" options={STATUS_OPTIONS} placeholder="Tous les statuts" />
        </div>

        <OrganizationsTable
          filtered={filtered}
          organizations={items.map((item) => ({
            id: item.id,
            nom: item.nom,
            devise: item.devise,
            actif: item.actif,
            creeLe: item.creeLe,
            owner: item.owner,
            stores: item.stores,
            products: item.products,
            sales: item.sales,
            revenue: item.revenue,
            status: item.status,
            lastActivityLabel: item.lastActivity ? formatRelative(item.lastActivity, now) : null,
          }))}
        />

        <Pagination basePath="/admin/boutiques" searchParams={params} page={page} totalPages={totalPages} total={total} />
      </Card>
    </div>
  );
}
