import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PurchaseFormModal } from "./PurchaseFormModal";
import { PurchaseDetailsModal } from "./PurchaseDetailsModal";

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
  // Achat tout juste enregistré : son bon d'achat s'affiche, prêt à imprimer.
  const [createdId, setCreatedId] = useState<number | null>(null);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icon name="plus" className="h-4 w-4" />
        Nouvel achat
      </Button>
      <PurchaseFormModal
        open={open}
        onClose={() => setOpen(false)}
        onSaved={(purchaseId) => {
          setCreatedId(purchaseId);
          router.refresh();
        }}
        products={products}
        suppliers={suppliers}
        currency={currency}
      />
      <PurchaseDetailsModal purchaseId={createdId} currency={currency} title="Achat enregistré" onClose={() => setCreatedId(null)} />
    </>
  );
}
