import type { ComponentProps } from "react";
import { useLoaderData } from "react-router";
import { loadPage } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { SaleForm } from "./SaleForm";

type NewSalePageData = ComponentProps<typeof SaleForm>;

export function loader() {
  return loadPage<NewSalePageData>("/ventes/nouvelle");
}

export default function NewSalePage() {
  const { products, customers, currency } = useLoaderData<NewSalePageData>();

  return (
    <div>
      <PageHeader title="Nouvelle vente" description="Ajoutez des produits au panier puis encaissez." />
      <SaleForm products={products} customers={customers} currency={currency} />
    </div>
  );
}
