import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema, type CustomerFormData } from "@/lib/validations/customer";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormField, inputClass } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/ToastProvider";
import { apiFetch } from "@/lib/api";

export type CustomerRow = { id: number; nom: string; telephone: string | null; email: string | null; adresse: string | null };

/** Valeurs du formulaire : celles de la fiche en modification, sinon vides. */
function toFormValues(customer?: CustomerRow | null) {
  return customer
    ? { nom: customer.nom, telephone: customer.telephone ?? "", email: customer.email ?? "", adresse: customer.adresse ?? "" }
    : { nom: "", telephone: "", email: "", adresse: "" };
}

export function CustomerFormModal({
  open,
  onClose,
  onSaved,
  customer,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  customer?: CustomerRow | null;
}) {
  const { push } = useToast();
  const isEdit = Boolean(customer);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: toFormValues(customer),
  });

  // Le modal reste monté dans le tableau : `defaultValues` n'est lu qu'au
  // premier rendu. On recharge donc les valeurs à chaque ouverture.
  useEffect(() => {
    // `keepFieldsRef` : sans lui, `reset` oublie les champs déjà montés et,
    // avec le React Compiler (appels à `register` mémoïsés), ils ne sont jamais
    // réenregistrés : la saisie était ignorée et le champ jugé vide.
    if (open) reset(toFormValues(customer), { keepFieldsRef: true });
  }, [open, customer, reset]);

  async function onSubmit(data: CustomerFormData) {
    const url = isEdit ? `/api/customers/${customer!.id}` : "/api/customers";
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
    push(isEdit ? "Client mis à jour" : "Client ajouté", "success");
    reset();
    onSaved();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Modifier le client" : "Nouveau client"}>
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
