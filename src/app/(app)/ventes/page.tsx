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
import { SalesStats, type SalesStatsData } from "./SalesStats";
import { PeriodSelector, periodLabel, type SalesPeriod } from "./PeriodSelector";

type SalesPageData = {
  sales: ComponentProps<typeof SalesTable>["sales"];
  period: SalesPeriod;
  stats: SalesStatsData;
  canCancel: boolean;
  canCollect: boolean;
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
  const { sales, period, stats, canCancel, canCollect, currency, page, totalPages, total } = useLoaderData<SalesPageData>();

  return (
    <div>
      <PageHeader
        title="Ventes"
        description={`Ventes et résultats de cette boutique · ${periodLabel(period)}`}
        action={
          <>
            <LinkButton href="/devis/nouveau" variant="secondary">
              <Icon name="file" className="h-4 w-4" />
              Nouveau devis
            </LinkButton>
            <LinkButton href="/ventes/nouvelle">
              <Icon name="plus" className="h-4 w-4" />
              Nouvelle vente
            </LinkButton>
          </>
        }
      />

      <div className="mb-4">
        {/* La clé réinitialise le sélecteur quand la période change (ex : retour arrière). */}
        <PeriodSelector key={`${period.key}-${period.from}-${period.to}`} period={period} />
      </div>

      <SalesStats stats={stats} currency={currency} />

      <Card>
        <div className="border-b border-slate-100 p-4">
          <SearchInput placeholder="Rechercher par produit ou client…" />
        </div>

        <SalesTable sales={sales} canCancel={canCancel} canCollect={canCollect} canViewFinance={stats.grossMargin !== null} currency={currency} />

        <Pagination basePath="/ventes" searchParams={params} page={page} totalPages={totalPages} total={total} />
      </Card>
    </div>
  );
}
