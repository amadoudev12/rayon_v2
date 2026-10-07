import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  expenseSchema,
  type ExpenseFormData,
  type ExpenseFormInput,
  EXPENSE_CATEGORIES,
} from "@/lib/validations/expense";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormField, inputClass, selectClass } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/ToastProvider";
import { apiFetch } from "@/lib/api";

export function ExpenseFormModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { push } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormInput, unknown, ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { categorie: EXPENSE_CATEGORIES[0] },
  });

  async function onSubmit(data: ExpenseFormData) {
    const response = await apiFetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      push(body?.message ?? "Impossible d'ajouter cette dépense", "error");
      return;
    }
    push("Dépense ajoutée", "success");
    reset();
    onSaved();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle dépense">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Catégorie" htmlFor="categorie" error={errors.categorie?.message}>
          <select id="categorie" className={selectClass} {...register("categorie")}>
            {EXPENSE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Description" htmlFor="libelle" error={errors.libelle?.message}>
          <input id="libelle" className={inputClass} {...register("libelle")} />
        </FormField>
        <FormField label="Montant" htmlFor="montant" error={errors.montant?.message}>
          <input id="montant" type="number" step="0.01" className={inputClass} {...register("montant")} />
        </FormField>
        <FormField label="Note (optionnel)" htmlFor="note">
          <input id="note" className={inputClass} {...register("note")} />
        </FormField>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Ajouter
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
