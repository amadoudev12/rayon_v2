import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { loadPage } from "@/lib/api";
import { useSearchParamsRecord } from "@/lib/navigation";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { Role } from "@/generated/prisma/enums";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";
import { SelectFilter } from "@/components/ui/SelectFilter";
import { Pagination } from "@/components/ui/Pagination";
import { formatRelative } from "@/lib/format";
import { UsersTable } from "./UsersTable";

/** Compte de la liste, calculé par le backend (`listUsers`). */
type UserListItem = {
  id: number;
  prenom: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  superAdmin: boolean;
  actif: boolean;
  creeLe: string;
  derniereActiviteLe: string | null;
  role: Role | null;
  organization: { id: number; nom: string; actif: boolean } | null;
  storeName: string | null;
};

type AdminUsersPageData = {
  items: UserListItem[];
  total: number;
  filtered: boolean;
  page: number;
  totalPages: number;
};

export function loader({ request }: LoaderFunctionArgs) {
  return loadPage<AdminUsersPageData>("/admin/utilisateurs", request);
}

const ROLE_OPTIONS = [
  ...Object.values(Role).map((role) => ({ value: role, label: ROLE_LABELS[role] })),
  { value: "SUPER_ADMIN", label: "Super administrateur" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Actifs" },
  { value: "disabled", label: "Désactivés" },
  { value: "onboarding", label: "Inscription inachevée" },
];

export default function AdminUsersPage() {
  const params = useSearchParamsRecord();
  const { items, total, filtered, page, totalPages } = useLoaderData<AdminUsersPageData>();
  const now = new Date();

  return (
    <div>
      <PageHeader title="Utilisateurs" description={`${total} compte(s) sur la plateforme, toutes boutiques confondues.`} />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <SearchInput placeholder="Rechercher un nom, un email, un téléphone, une boutique…" />
          <SelectFilter paramName="role" options={ROLE_OPTIONS} placeholder="Tous les rôles" />
          <SelectFilter paramName="status" options={STATUS_OPTIONS} placeholder="Tous les statuts" />
        </div>

        <UsersTable
          filtered={filtered}
          users={items.map((item) => ({
            id: item.id,
            prenom: item.prenom,
            nom: item.nom,
            email: item.email,
            telephone: item.telephone,
            superAdmin: item.superAdmin,
            actif: item.actif,
            creeLe: item.creeLe,
            roleLabel: item.role ? ROLE_LABELS[item.role] : null,
            organization: item.organization,
            storeName: item.storeName,
            lastActivityLabel: item.derniereActiviteLe ? formatRelative(item.derniereActiviteLe, now) : null,
          }))}
        />

        <Pagination basePath="/admin/utilisateurs" searchParams={params} page={page} totalPages={totalPages} total={total} />
      </Card>
    </div>
  );
}
