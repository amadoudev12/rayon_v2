import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminProfileSchema, type AdminProfileData } from "@/lib/validations/admin";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { FormField, inputClass } from "@/components/ui/FormField";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useToast } from "@/components/ui/ToastProvider";
import { apiFetch } from "@/lib/api";

export function ProfileForm({ user }: { user: { prenom: string; nom: string; identifiant: string } }) {
  const router = useRouter();
  const { push } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<AdminProfileData>({
    resolver: zodResolver(adminProfileSchema),
    defaultValues: { prenom: user.prenom, nom: user.nom, motDePasseActuel: "", nouveauMotDePasse: "" },
  });

  async function onSubmit(data: AdminProfileData) {
    setServerError(null);
    const response = await apiFetch("/api/admin/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      setServerError(body?.message ?? "Enregistrement impossible.");
      return;
    }
    push(data.nouveauMotDePasse ? "Profil et mot de passe mis à jour" : "Profil mis à jour", "success");
    resetField("motDePasseActuel");
    resetField("nouveauMotDePasse");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Prénom" htmlFor="profileFirstName" error={errors.prenom?.message}>
            <input id="profileFirstName" className={inputClass} {...register("prenom")} />
          </FormField>
          <FormField label="Nom" htmlFor="profileLastName" error={errors.nom?.message}>
            <input id="profileLastName" className={inputClass} {...register("nom")} />
          </FormField>
        </div>
        <FormField label="Identifiant de connexion" htmlFor="profileIdentifier" hint="L'identifiant de connexion ne se modifie pas ici.">
          <input id="profileIdentifier" className={inputClass} value={user.identifiant} disabled readOnly />
        </FormField>

        <div className="border-t border-slate-100 pt-4">
          <p className="text-[13px] font-semibold text-slate-900">Changer le mot de passe</p>
          <p className="mt-0.5 text-xs text-slate-500">Laissez ces champs vides pour le conserver.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Mot de passe actuel" htmlFor="profileCurrentPassword" error={errors.motDePasseActuel?.message}>
            <PasswordInput
              id="profileCurrentPassword"
              autoComplete="current-password"
              {...register("motDePasseActuel")}
            />
          </FormField>
          <FormField
            label="Nouveau mot de passe"
            htmlFor="profileNewPassword"
            error={errors.nouveauMotDePasse?.message}
            hint="8 caractères minimum, avec une lettre et un chiffre."
          >
            <PasswordInput
              id="profileNewPassword"
              autoComplete="new-password"
              {...register("nouveauMotDePasse")}
            />
          </FormField>
        </div>

        {serverError && <Alert>{serverError}</Alert>}
      </div>

      <div className="flex justify-end border-t border-slate-100 bg-slate-50/60 px-5 py-3">
        <Button type="submit" loading={isSubmitting}>
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
