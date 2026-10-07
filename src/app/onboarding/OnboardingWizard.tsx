import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "@/lib/auth/client";
import { onboardingSchema, type OnboardingFormData, type OnboardingFormInput } from "@/lib/validations/onboarding";
import { productSchema, type ProductFormData, type ProductFormInput } from "@/lib/validations/product";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField, inputClass, selectClass } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";
import { Icon } from "@/components/ui/Icon";
import { apiFetch } from "@/lib/api";

const STEPS = ["Votre boutique", "Premier produit", "C'est parti !"] as const;

const CURRENCIES = [
  { value: "XOF", label: "Franc CFA (XOF)" },
  { value: "XAF", label: "Franc CFA Central (XAF)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "USD", label: "Dollar US (USD)" },
  { value: "MAD", label: "Dirham marocain (MAD)" },
  { value: "GNF", label: "Franc guinéen (GNF)" },
  { value: "CDF", label: "Franc congolais (CDF)" },
];

function Stepper({ step }: { step: number }) {
  return (
    <ol className="mb-7 flex items-center gap-2">
      {STEPS.map((label, index) => {
        const done = index < step;
        const current = index === step;
        return (
          <li key={label} className="flex flex-1 items-center gap-2 last:flex-none">
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors ${
                done
                  ? "bg-brand-600 text-white"
                  : current
                    ? "bg-white text-brand-700 ring-2 ring-brand-600"
                    : "bg-white text-slate-400 ring-1 ring-slate-200"
              }`}
            >
              {done ? <Icon name="check" className="h-3.5 w-3.5" /> : index + 1}
            </div>
            <span
              className={`hidden whitespace-nowrap text-xs font-medium sm:block ${
                current ? "text-slate-900" : done ? "text-slate-600" : "text-slate-400"
              }`}
            >
              {label}
            </span>
            {index < STEPS.length - 1 && (
              <div className={`h-px flex-1 transition-colors ${done ? "bg-brand-600" : "bg-slate-200"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function OnboardingWizard() {
  const router = useRouter();
  const { update } = useSession();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [productSkipped, setProductSkipped] = useState(false);

  const orgForm = useForm<OnboardingFormInput, unknown, OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { devise: "XOF" },
  });
  const productForm = useForm<ProductFormInput, unknown, ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { unite: "unité", seuilAlerte: 5 },
  });

  async function submitOrganization(data: OnboardingFormData) {
    setError(null);
    const response = await apiFetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.message ?? "Impossible de créer votre organisation.");
      return;
    }
    await update(); // refresh the JWT so session.user.tenant is populated
    setStep(1);
  }

  async function submitProduct(data: ProductFormData) {
    setError(null);
    const response = await apiFetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.message ?? "Impossible d'ajouter ce produit.");
      return;
    }
    setStep(2);
  }

  return (
    <Card className="p-6 sm:p-7">
      <Stepper step={step} />

      {step === 0 && (
        <form onSubmit={orgForm.handleSubmit(submitOrganization)} className="space-y-4">
          <FormField
            label="Nom de votre organisation"
            htmlFor="nomOrganisation"
            error={orgForm.formState.errors.nomOrganisation?.message}
          >
            <input
              id="nomOrganisation"
              placeholder="Ex : Boutique Fatou"
              className={inputClass}
              {...orgForm.register("nomOrganisation")}
            />
          </FormField>
          <FormField label="Nom de la boutique" htmlFor="nomBoutique" error={orgForm.formState.errors.nomBoutique?.message}>
            <input
              id="nomBoutique"
              placeholder="Ex : Boutique centre-ville"
              className={inputClass}
              {...orgForm.register("nomBoutique")}
            />
          </FormField>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Adresse (optionnel)" htmlFor="adresseBoutique">
              <input id="adresseBoutique" className={inputClass} {...orgForm.register("adresseBoutique")} />
            </FormField>
            <FormField label="Téléphone (optionnel)" htmlFor="telephoneBoutique">
              <input id="telephoneBoutique" className={inputClass} {...orgForm.register("telephoneBoutique")} />
            </FormField>
          </div>
          <FormField label="Devise" htmlFor="devise">
            <select id="devise" className={selectClass} {...orgForm.register("devise")}>
              {CURRENCIES.map((currency) => (
                <option key={currency.value} value={currency.value}>
                  {currency.label}
                </option>
              ))}
            </select>
          </FormField>

          {error && <Alert>{error}</Alert>}

          <Button type="submit" size="lg" loading={orgForm.formState.isSubmitting} className="w-full">
            Continuer
          </Button>
        </form>
      )}

      {step === 1 && (
        <form onSubmit={productForm.handleSubmit(submitProduct)} className="space-y-4">
          <p className="text-sm text-slate-600">
            Ajoutez votre premier produit pour commencer à vendre. Vous pourrez en ajouter d&apos;autres ensuite.
          </p>
          <FormField label="Nom du produit" htmlFor="nom" error={productForm.formState.errors.nom?.message}>
            <input id="nom" className={inputClass} {...productForm.register("nom")} />
          </FormField>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Prix d'achat"
              htmlFor="prixAchat"
              error={productForm.formState.errors.prixAchat?.message}
            >
              <input id="prixAchat" type="number" step="0.01" className={inputClass} {...productForm.register("prixAchat")} />
            </FormField>
            <FormField
              label="Prix de vente"
              htmlFor="prixVente"
              error={productForm.formState.errors.prixVente?.message}
            >
              <input id="prixVente" type="number" step="0.01" className={inputClass} {...productForm.register("prixVente")} />
            </FormField>
          </div>
          <FormField label="Quantité en stock" htmlFor="quantiteInitiale">
            <input id="quantiteInitiale" type="number" className={inputClass} {...productForm.register("quantiteInitiale")} />
          </FormField>

          {error && <Alert>{error}</Alert>}

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setProductSkipped(true);
                setStep(2);
              }}
            >
              Passer cette étape
            </Button>
            <Button type="submit" loading={productForm.formState.isSubmitting} className="flex-1">
              Ajouter et continuer
            </Button>
          </div>
        </form>
      )}

      {step === 2 && (
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200/70">
            <Icon name="check" className="h-6 w-6" />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900">Votre boutique est prête !</p>
            <p className="mt-1 text-sm text-slate-500">
              {productSkipped
                ? "Ajoutez vos produits puis enregistrez votre première vente pour voir vos statistiques prendre vie."
                : "Enregistrez votre première vente pour voir vos statistiques prendre vie."}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button size="lg" onClick={() => router.push("/ventes/nouvelle")} className="w-full">
              Faire ma première vente
            </Button>
            <Button size="lg" variant="secondary" onClick={() => router.push("/dashboard")} className="w-full">
              Aller au tableau de bord
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
