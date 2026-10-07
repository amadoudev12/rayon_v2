import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supplierSchema, type SupplierFormData } from "@/lib/validations/supplier";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormField, inputClass } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/ToastProvider";
import { apiFetch } from "@/lib/api";

export type SupplierRow = { id: number; nom: string; telephone: string | null; email: string | null; adresse: string | null };

/** Valeurs du formulaire : celles de la fiche en modification, sinon vides. */
function toFormValues(supplier?: SupplierRow | null) {
  return supplier
    ? { nom: supplier.nom, telephone: supplier.telephone ?? "", email: supplier.email ?? "", adresse: supplier.adresse ?? "" }
    : { nom: "", telephone: "", email: "", adresse: "" };
}

export function SupplierFormModal({
  open,
  onClose,
  onSaved,
  supplier,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  supplier?: SupplierRow | null;
}) {
  const { push } = useToast();
  const isEdit = Boolean(supplier);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: toFormValues(supplier),
  });

  // Le modal reste monté dans le tableau : `defaultValues` n'est lu qu'au
  // premier rendu. On recharge donc les valeurs à chaque ouverture.
  useEffect(() => {
    // `keepFieldsRef` : sans lui, `reset` oublie les champs déjà montés et,
    // avec le React Compiler (appels à `register` mémoïsés), ils ne sont jamais
    // réenregistrés : la saisie était ignorée et le champ jugé vide.
    if (open) reset(toFormValues(supplier), { keepFieldsRef: true });
  }, [open, supplier, reset]);

  async function onSubmit(data: SupplierFormData) {
    const url = isEdit ? `/api/suppliers/${supplier!.id}` : "/api/suppliers";
    const response = await apiFetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      push(body?.message ?? "Une erreur est survenue", "error");
      return;
    }
    push(isEdit ? "Fournisseur mis à jour" : "Fournisseur ajouté", "success");
    reset();
    onSaved();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Modifier le fournisseur" : "Nouveau fournisseur"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Nom" htmlFor="nom" error={errors.nom?.message}>
          <input id="nom" className={inputClass} {...register("nom")} />
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Téléphone (optionnel)" htmlFor="telephone">
            <input id="telephone" className={inputClass} {...register("telephone")} />
          </FormField>
          <FormField label="Email (optionnel)" htmlFor="email" error={errors.email?.message}>
            <input id="email" className={inputClass} {...register("email")} />
          </FormField>
        </div>
        <FormField label="Adresse (optionnel)" htmlFor="adresse">
          <input id="adresse" className={inputClass} {...register("adresse")} />
        </FormField>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? "Enregistrer" : "Ajouter"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
