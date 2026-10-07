import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PurchaseFormModal } from "./PurchaseFormModal";

export function NewPurchaseButton({
  products,
  suppliers,
  currency = "XOF",
}: {
  products: { id: number; nom: string; unite: string; prixAchat: number }[];
  suppliers: { id: number; nom: string }[];
  currency?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icon name="plus" className="h-4 w-4" />
        Nouvel achat
      </Button>
      <PurchaseFormModal
        open={open}
        onClose={() => setOpen(false)}
        onSaved={() => router.refresh()}
        products={products}
        suppliers={suppliers}
        currency={currency}
      />
    </>
  );
}
