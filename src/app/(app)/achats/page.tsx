import type { ComponentProps } from "react";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { loadPage } from "@/lib/api";
import { useSearchParamsRecord } from "@/lib/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { PurchasesTable } from "./PurchasesTable";
import { NewPurchaseButton } from "./NewPurchaseButton";

type PurchasesPageData = {
  purchases: ComponentProps<typeof PurchasesTable>["purchases"];
  products: ComponentProps<typeof NewPurchaseButton>["products"];
  suppliers: ComponentProps<typeof NewPurchaseButton>["suppliers"];
  currency: string;
  page: number;
  totalPages: number;
  total: number;
};

export function loader({ request }: LoaderFunctionArgs) {
  return loadPage<PurchasesPageData>("/achats", request);
}

export default function PurchasesPage() {
  const params = useSearchParamsRecord();
  const { purchases, products, suppliers, currency, page, totalPages, total } = useLoaderData<PurchasesPageData>();

  return (
    <div>
      <PageHeader
        title="Achats"
        description="Enregistrez vos approvisionnements fournisseurs."
        action={<NewPurchaseButton products={products} suppliers={suppliers} currency={currency} />}
      />

      <Card>
        <PurchasesTable purchases={purchases} currency={currency} />

        <Pagination basePath="/achats" searchParams={params} page={page} totalPages={totalPages} total={total} />
      </Card>
    </div>
  );
}
