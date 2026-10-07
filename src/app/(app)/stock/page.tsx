import type { ComponentProps } from "react";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { loadPage } from "@/lib/api";
import { useSearchParamsRecord } from "@/lib/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";
import { SelectFilter } from "@/components/ui/SelectFilter";
import { Pagination } from "@/components/ui/Pagination";
import { StockTable } from "./StockTable";
import { LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

type StockPageData = {
  stocks: ComponentProps<typeof StockTable>["stocks"];
  canAdjust: boolean;
  currency: string;
  page: number;
  totalPages: number;
  total: number;
};

export function loader({ request }: LoaderFunctionArgs) {
  return loadPage<StockPageData>("/stock", request);
}

export default function StockPage() {
  const params = useSearchParamsRecord();
  const { stocks, canAdjust, currency, page, totalPages, total } = useLoaderData<StockPageData>();

  return (
    <div>
      <PageHeader
        title="Stock"
        description="Suivez les quantités disponibles et corrigez-les si besoin."
        action={
          <LinkButton href="/stock/mouvements" variant="secondary">
            <Icon name="history" className="h-4 w-4" />
            Historique des mouvements
          </LinkButton>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput placeholder="Rechercher un produit…" />
          <SelectFilter
            paramName="lowStock"
            placeholder="Tous les produits"
            options={[{ value: "true", label: "Stock faible uniquement" }]}
          />
        </div>

        <StockTable stocks={stocks} canAdjust={canAdjust} currency={currency} />

        <Pagination basePath="/stock" searchParams={params} page={page} totalPages={totalPages} total={total} />
      </Card>
    </div>
  );
}
