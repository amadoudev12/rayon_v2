import { useState, type ComponentProps } from "react";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { loadPage } from "@/lib/api";
import { useRouter } from "@/lib/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { SaleForm, type QuoteToConvert } from "./SaleForm";

type NewSalePageData = Pick<ComponentProps<typeof SaleForm>, "products" | "customers" | "currency"> & {
  /** Présent avec `?devis=ID` : devis à transformer en vente. */
  quote: QuoteToConvert | null;
};

export function loader({ request }: LoaderFunctionArgs) {
  return loadPage<NewSalePageData>("/ventes/nouvelle", request);
}

export default function NewSalePage() {
  const router = useRouter();
  const { products, customers, currency, quote } = useLoaderData<NewSalePageData>();
  // Changer la clé repart d'un panier vide ; le rechargement met le stock à jour.
  const [formKey, setFormKey] = useState(0);

  return (
    <div>
      <PageHeader
        title={quote ? "Transformer un devis en vente" : "Nouvelle vente"}
        description="Ajoutez des produits au panier puis encaissez."
      />
      <SaleForm
        key={`${formKey}-${quote?.id ?? ""}`}
        products={products}
        customers={customers}
        currency={currency}
        fromQuote={quote}
        onRestart={() => {
          setFormKey((value) => value + 1);
          // Sans le paramètre `devis` : la vente suivante part d'un panier vide.
          router.push("/ventes/nouvelle");
        }}
      />
    </div>
  );
}
