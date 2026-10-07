import { Link } from "@/lib/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "@/lib/auth/client";
import { useRouter } from "@/lib/navigation";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField, inputClass } from "@/components/ui/FormField";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Alert } from "@/components/ui/Alert";
import { apiFetch } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterFormData) {
    setServerError(null);

    const response = await apiFetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      setServerError(body?.message ?? "Impossible de créer le compte.");
      return;
    }

    const result = await signIn("credentials", {
      identifiant: data.identifiant,
      motDePasse: data.motDePasse,
      redirect: false,
    });

    if (result?.error) {
      setServerError("Compte créé, mais la connexion automatique a échoué. Connectez-vous manuellement.");
      router.push("/login");
      return;
    }

    router.push("/onboarding");
    router.refresh();
  }

  return (
    <Card className="p-6 sm:p-7">
      <h2 className="text-base font-semibold text-slate-900">Créer un compte</h2>
      <p className="mt-1 text-sm text-slate-500">Commencez à gérer votre commerce en quelques minutes.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Prénom" htmlFor="prenom" error={errors.prenom?.message}>
            <input id="prenom" className={inputClass} {...register("prenom")} />
          </FormField>
          <FormField label="Nom" htmlFor="nom" error={errors.nom?.message}>
            <input id="nom" className={inputClass} {...register("nom")} />
          </FormField>
        </div>
        <FormField
          label="Email ou téléphone"
          htmlFor="identifiant"
          error={errors.identifiant?.message}
          hint="Il servira à vous connecter. Pour un numéro, indiquez l'indicatif : +221 77 123 45 67."
        >
          <input id="identifiant" type="text" autoComplete="username" className={inputClass} {...register("identifiant")} />
        </FormField>
        <FormField
          label="Mot de passe"
          htmlFor="motDePasse"
          error={errors.motDePasse?.message}
          hint="8 caractères minimum, avec au moins une lettre et un chiffre."
        >
          <PasswordInput
            id="motDePasse"
            autoComplete="new-password"
            {...register("motDePasse")}
          />
        </FormField>

        {serverError && <Alert>{serverError}</Alert>}

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          Créer mon compte
        </Button>
      </form>

      <p className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
        Déjà inscrit ?{" "}
        <Link href="/login" className="font-medium text-brand-600 transition-colors hover:text-brand-700 hover:underline">
          Se connecter
        </Link>
      </p>
    </Card>
  );
}
