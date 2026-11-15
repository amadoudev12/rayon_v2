import type { ComponentProps } from "react";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { loadPage } from "@/lib/api";
import { useSearchParamsRecord } from "@/lib/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { CustomersTable } from "./CustomersTable";
import { NewCustomerButton } from "./NewCustomerButton";
import { ArchiveToggle } from "@/components/ui/ArchiveToggle";

type CustomersPageData = {
  customers: ComponentProps<typeof CustomersTable>["customers"];
  canManage: boolean;
  canDelete: boolean;
  showArchived: boolean;
  page: number;
  totalPages: number;
  total: number;
};

export function loader({ request }: LoaderFunctionArgs) {
  return loadPage<CustomersPageData>("/clients", request);
}

export default function CustomersPage() {
  const params = useSearchParamsRecord();
  const { customers, canManage, canDelete, showArchived, page, totalPages, total } = useLoaderData<CustomersPageData>();

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Votre carnet de clients."
        action={canManage ? <NewCustomerButton /> : undefined}
      />

      <Card>
        <div className="flex items-center gap-3 border-b border-slate-100 p-4">
          <div className="flex-1">
            <SearchInput placeholder="Rechercher un client…" />
          </div>
          <ArchiveToggle basePath="/clients" showArchived={showArchived} />
        </div>

        <CustomersTable customers={customers} canManage={canManage} canDelete={canDelete} showArchived={showArchived} />

        <Pagination basePath="/clients" searchParams={params} page={page} totalPages={totalPages} total={total} />
      </Card>
    </div>
  );
}
