import { useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "@/lib/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  adminCreateOrganizationSchema,
  type AdminCreateOrganizationData,
  type AdminCreateOrganizationInput,
} from "@/lib/validations/admin";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { FormField, inputClass, selectClass } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/ToastProvider";
import { apiFetch } from "@/lib/api";

const CURRENCIES = [
  { value: "XOF", label: "Franc CFA (XOF)" },
  { value: "XAF", label: "Franc CFA Central (XAF)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "USD", label: "Dollar US (USD)" },
  { value: "MAD", label: "Dirham marocain (MAD)" },
  { value: "GNF", label: "Franc guinéen (GNF)" },
  { value: "CDF", label: "Franc congolais (CDF)" },
];

const subscribeNothing = () => () => {};

/** Bouton « Nouvelle boutique » et son formulaire ; `defaultOpen` l'ouvre d'emblée (action rapide du tableau de bord). */
export function NewOrganizationButton({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { push } = useToast();
  const [requestedOpen, setOpen] = useState(defaultOpen);
  // Faux pendant le rendu serveur et l'hydratation, vrai ensuite : `Modal` ne
  // se rend que dans le navigateur, l'ouvrir plus tôt créerait un écart.
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const open = requestedOpen && hydrated;
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminCreateOrganizationInput, unknown, AdminCreateOrganizationData>({
    resolver: zodResolver(adminCreateOrganizationSchema),
    defaultValues: { devise: "XOF" },
  });

  function close() {
    setOpen(false);
    setServerError(null);
    // Retire `?new=1` pour qu'un rafraîchissement ne rouvre pas la fenêtre.
    if (defaultOpen) router.replace(pathname);
  }

  async function onSubmit(data: AdminCreateOrganizationData) {
    setServerError(null);
    const response = await apiFetch("/api/admin/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      setServerError(body?.message ?? "Impossible de créer cette boutique.");
      return;
    }
    push("Boutique créée. Communiquez ses identifiants au propriétaire.", "success");
    reset();
    setOpen(false);
    router.push(`/admin/boutiques/${body.data.id}`);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icon name="plus" className="h-4 w-4" />
        Nouvelle boutique
      </Button>

      <Modal
        open={open}
        onClose={close}
        title="Ajouter une boutique"
        description="Crée l'organisation, son premier point de vente et le compte de son propriétaire."
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Nom de la boutique" htmlFor="orgName" error={errors.nomOrganisation?.message}>
              <input id="orgName" className={inputClass} autoFocus {...register("nomOrganisation")} />
            </FormField>
            <FormField label="Devise" htmlFor="orgCurrency" error={errors.devise?.message}>
              <select id="orgCurrency" className={selectClass} {...register("devise")}>
                {CURRENCIES.map((currency) => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField
            label="Premier point de vente"
            htmlFor="orgStore"
            error={errors.nomBoutique?.message}
            hint="Ex : « Boutique principale ». Le propriétaire pourra en ajouter d'autres."
          >
            <input id="orgStore" className={inputClass} {...register("nomBoutique")} />
          </FormField>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-[13px] font-semibold text-slate-900">Compte du propriétaire</p>
            <p className="mt-0.5 text-xs text-slate-500">Il aura tous les droits sur cette boutique uniquement.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Prénom" htmlFor="ownerFirstName" error={errors.prenom?.message}>
              <input id="ownerFirstName" className={inputClass} {...register("prenom")} />
            </FormField>
            <FormField label="Nom" htmlFor="ownerLastName" error={errors.nom?.message}>
              <input id="ownerLastName" className={inputClass} {...register("nom")} />
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Email ou téléphone" htmlFor="ownerIdentifier" error={errors.identifiant?.message}>
              <input id="ownerIdentifier" type="text" autoComplete="off" className={inputClass} {...register("identifiant")} />
            </FormField>
            <FormField label="Mot de passe temporaire" htmlFor="ownerPassword" error={errors.motDePasse?.message}>
              <input id="ownerPassword" type="text" autoComplete="off" className={inputClass} {...register("motDePasse")} />
            </FormField>
          </div>

          <Alert tone="warning">
            Aucun message n&apos;est envoyé automatiquement : communiquez vous-même ces identifiants au propriétaire. Un numéro
            de téléphone doit comporter l&apos;indicatif du pays (ex : +221 77 123 45 67).
          </Alert>
          {serverError && <Alert>{serverError}</Alert>}

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={close}>
              Annuler
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Créer la boutique
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  );
}
