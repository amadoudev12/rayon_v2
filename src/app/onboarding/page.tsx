import { useLoaderData } from "react-router";
import { loadPage } from "@/lib/api";
import { OnboardingWizard } from "./OnboardingWizard";
import { AuthShell } from "@/components/layout/AuthShell";

/** État réel du compte lu en base par le backend : tout compte déjà configuré est redirigé. */
export function loader() {
  return loadPage<{ name: string }>("/onboarding");
}

export default function OnboardingPage() {
  const { name } = useLoaderData<{ name: string }>();

  return (
    <AuthShell title={`Bienvenue, ${name}`} subtitle="Configurons votre boutique en 2 minutes." width="lg">
      <OnboardingWizard />
    </AuthShell>
  );
}
