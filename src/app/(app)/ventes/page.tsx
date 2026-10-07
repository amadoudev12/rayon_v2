import type { ComponentProps } from "react";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { loadPage } from "@/lib/api";
import { useSearchParamsRecord } from "@/lib/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SalesTable } from "./SalesTable";

type SalesPageData = {
  sales: ComponentProps<typeof SalesTable>["sales"];
  canCancel: boolean;
  currency: string;
  page: number;
  totalPages: number;
  total: number;
};

export function loader({ request }: LoaderFunctionArgs) {
  return loadPage<SalesPageData>("/ventes", request);
}

export default function SalesPage() {
  const params = useSearchParamsRecord();
  const { sales, canCancel, currency, page, totalPages, total } = useLoaderData<SalesPageData>();

  return (
    <div>
      <PageHeader
        title="Ventes"
        description="Historique des ventes de cette boutique."
        action={
          <LinkButton href="/ventes/nouvelle">
            <Icon name="plus" className="h-4 w-4" />
            Nouvelle vente
          </LinkButton>
        }
      />

      <Card>
        <div className="border-b border-slate-100 p-4">
          <SearchInput placeholder="Rechercher par produit ou client…" />
        </div>

        <SalesTable sales={sales} canCancel={canCancel} currency={currency} />

        <Pagination basePath="/ventes" searchParams={params} page={page} totalPages={totalPages} total={total} />
      </Card>
    </div>
  );
}
