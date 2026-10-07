import { LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 text-center">
      <p className="text-sm font-semibold text-brand-600">Erreur 404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Page introuvable</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">Cette page n&apos;existe pas ou a été déplacée.</p>
      <LinkButton href="/dashboard" variant="secondary" className="mt-6">
        <Icon name="arrowLeft" className="h-4 w-4" />
        Retour au tableau de bord
      </LinkButton>
    </div>
  );
}
