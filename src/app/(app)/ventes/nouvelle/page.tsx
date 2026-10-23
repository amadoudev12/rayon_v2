import { useState, type ComponentProps } from "react";
import { useLoaderData } from "react-router";
import { loadPage } from "@/lib/api";
import { useRouter } from "@/lib/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { SaleForm } from "./SaleForm";

type NewSalePageData = Pick<ComponentProps<typeof SaleForm>, "products" | "customers" | "currency">;

export function loader() {
  return loadPage<NewSalePageData>("/ventes/nouvelle");
}

export default function NewSalePage() {
  const router = useRouter();
  const { products, customers, currency } = useLoaderData<NewSalePageData>();
  // Changer la clé repart d'un panier vide ; le rechargement met le stock à jour.
  const [formKey, setFormKey] = useState(0);

  return (
    <div>
      <PageHeader title="Nouvelle vente" description="Ajoutez des produits au panier puis encaissez." />
      <SaleForm
        key={formKey}
        products={products}
        customers={customers}
        currency={currency}
        onRestart={() => {
          setFormKey((value) => value + 1);
          router.refresh();
        }}
      />
    </div>
  );
}
