import type { ComponentProps } from "react";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { loadPage } from "@/lib/api";
import { useSearchParamsRecord } from "@/lib/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";
import { SelectFilter } from "@/components/ui/SelectFilter";
import { Pagination } from "@/components/ui/Pagination";
import { ProductsTable } from "./ProductsTable";
import { NewProductButton } from "./NewProductButton";
import { ImportProductsButton } from "./ImportProductsButton";

type ProductsPageData = {
  products: ComponentProps<typeof ProductsTable>["products"];
  categories: ComponentProps<typeof ProductsTable>["categories"];
  canManage: boolean;
  currency: string;
  page: number;
  totalPages: number;
  total: number;
};

export function loader({ request }: LoaderFunctionArgs) {
  return loadPage<ProductsPageData>("/produits", request);
}

export default function ProductsPage() {
  const params = useSearchParamsRecord();
  const { products, categories, canManage, currency, page, totalPages, total } = useLoaderData<ProductsPageData>();

  return (
    <div>
      <PageHeader
        title="Produits"
        description="Gérez votre catalogue et vos prix."
        action={
          canManage ? (
            <>
              <ImportProductsButton />
              <NewProductButton categories={categories} />
            </>
          ) : undefined
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput placeholder="Rechercher un produit…" />
          <div className="flex gap-2">
            <SelectFilter
              paramName="categoryId"
              placeholder="Toutes les catégories"
              options={categories.map((category) => ({ value: String(category.id), label: category.nom }))}
            />
            <SelectFilter
              paramName="status"
              placeholder="Tous les statuts"
              options={[
                { value: "active", label: "Actifs" },
                { value: "archived", label: "Archivés" },
              ]}
            />
          </div>
        </div>

        <ProductsTable products={products} categories={categories} canManage={canManage} currency={currency} />

        <Pagination basePath="/produits" searchParams={params} page={page} totalPages={totalPages} total={total} />
      </Card>
    </div>
  );
}
