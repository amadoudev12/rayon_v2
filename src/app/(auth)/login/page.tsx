import { Link } from "@/lib/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "@/lib/auth/client";
import { useRouter } from "@/lib/navigation";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField, inputClass } from "@/components/ui/FormField";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Alert } from "@/components/ui/Alert";

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginFormData) {
    setServerError(null);
    const result = await signIn("credentials", { ...data, redirect: false });

    if (result?.error) {
      setServerError("Identifiant ou mot de passe incorrect.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="p-6 sm:p-7">
      <h2 className="text-base font-semibold text-slate-900">Connexion</h2>
      <p className="mt-1 text-sm text-slate-500">Accédez à votre espace de gestion.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <FormField label="Email ou téléphone" htmlFor="identifiant" error={errors.identifiant?.message}>
          <input id="identifiant" type="text" autoComplete="username" className={inputClass} {...register("identifiant")} />
        </FormField>
        <FormField label="Mot de passe" htmlFor="motDePasse" error={errors.motDePasse?.message}>
          <PasswordInput
            id="motDePasse"
            autoComplete="current-password"
            {...register("motDePasse")}
          />
        </FormField>

        {serverError && <Alert>{serverError}</Alert>}

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          Se connecter
        </Button>
      </form>

      <p className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
        Pas encore de compte ?{" "}
        <Link href="/register" className="font-medium text-brand-600 transition-colors hover:text-brand-700 hover:underline">
          Créer un compte
        </Link>
      </p>
    </Card>
  );
}
