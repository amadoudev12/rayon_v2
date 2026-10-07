import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  stockAdjustmentSchema,
  type StockAdjustmentFormData,
  type StockAdjustmentFormInput,
} from "@/lib/validations/product";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormField, inputClass } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/ToastProvider";
import { apiFetch } from "@/lib/api";

export function StockAdjustModal({
  open,
  onClose,
  onSaved,
  productId,
  productName,
  currentQuantity,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  productId: number;
  productName: string;
  currentQuantity: number;
}) {
  const { push } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StockAdjustmentFormInput, unknown, StockAdjustmentFormData>({
    resolver: zodResolver(stockAdjustmentSchema),
  });

  async function onSubmit(data: StockAdjustmentFormData) {
    const response = await apiFetch(`/api/products/${productId}/stock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      push(body?.message ?? "Ajustement impossible", "error");
      return;
    }

    push("Stock ajusté", "success");
    reset();
    onSaved();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={`Ajuster le stock — ${productName}`} size="sm">
      <p className="mb-4 text-sm text-slate-500">Stock actuel : {currentQuantity}</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label="Quantité (utilisez un nombre négatif pour retirer)"
          htmlFor="variationQuantite"
          error={errors.variationQuantite?.message}
        >
          <input id="variationQuantite" type="number" className={inputClass} {...register("variationQuantite")} />
        </FormField>
        <FormField label="Motif (optionnel)" htmlFor="note">
          <input id="note" placeholder="Inventaire, casse, don…" className={inputClass} {...register("note")} />
        </FormField>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Ajuster
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
