import { useState, type ComponentProps } from "react";
import { useLoaderData } from "react-router";
import { loadPage } from "@/lib/api";
import { useRouter } from "@/lib/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { SaleForm } from "../../ventes/nouvelle/SaleForm";

type NewQuotePageData = Pick<ComponentProps<typeof SaleForm>, "products" | "customers" | "currency">;

export function loader() {
  return loadPage<NewQuotePageData>("/devis/nouveau");
}

export default function NewQuotePage() {
  const router = useRouter();
  const { products, customers, currency } = useLoaderData<NewQuotePageData>();
  const [formKey, setFormKey] = useState(0);

  return (
    <div>
      <PageHeader
        title="Nouveau devis"
        description="Composez la proposition de prix : le stock et le chiffre d'affaires ne sont pas modifiés."
      />
      <SaleForm
        key={formKey}
        mode="quote"
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
