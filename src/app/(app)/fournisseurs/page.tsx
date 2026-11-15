import type { ComponentProps } from "react";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { loadPage } from "@/lib/api";
import { useSearchParamsRecord } from "@/lib/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { SuppliersTable } from "./SuppliersTable";
import { NewSupplierButton } from "./NewSupplierButton";
import { ArchiveToggle } from "@/components/ui/ArchiveToggle";

type SuppliersPageData = {
  suppliers: ComponentProps<typeof SuppliersTable>["suppliers"];
  canDelete: boolean;
  showArchived: boolean;
  page: number;
  totalPages: number;
  total: number;
};

export function loader({ request }: LoaderFunctionArgs) {
  return loadPage<SuppliersPageData>("/fournisseurs", request);
}

export default function SuppliersPage() {
  const params = useSearchParamsRecord();
  const { suppliers, canDelete, showArchived, page, totalPages, total } = useLoaderData<SuppliersPageData>();

  return (
    <div>
      <PageHeader title="Fournisseurs" description="Vos partenaires d'approvisionnement." action={<NewSupplierButton />} />

      <Card>
        <div className="flex items-center gap-3 border-b border-slate-100 p-4">
          <div className="flex-1">
            <SearchInput placeholder="Rechercher un fournisseur…" />
          </div>
          <ArchiveToggle basePath="/fournisseurs" showArchived={showArchived} />
        </div>

        <SuppliersTable suppliers={suppliers} canDelete={canDelete} showArchived={showArchived} />

        <Pagination basePath="/fournisseurs" searchParams={params} page={page} totalPages={totalPages} total={total} />
      </Card>
    </div>
  );
}
