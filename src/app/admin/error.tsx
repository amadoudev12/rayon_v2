import { useEffect } from "react";
import { isRouteErrorResponse, useRevalidator, useRouteError } from "react-router";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

export default function AdminError() {
  const error = useRouteError();
  const revalidator = useRevalidator();

  useEffect(() => {
    console.error(error);
  }, [error]);

  // Page inconnue : c'est la page « introuvable » du site qui s'affiche.
  if (isRouteErrorResponse(error) && error.status === 404) throw error;

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-inset ring-red-200/70">
          <Icon name="alertCircle" className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-slate-900">Une erreur est survenue</h2>
        <p className="mt-1 text-sm text-slate-500">
          Les données de la plateforme n&apos;ont pas pu être chargées. Vous pouvez réessayer.
        </p>
        <div className="mt-6 flex flex-col-reverse justify-center gap-2 sm:flex-row">
          <LinkButton href="/admin" variant="secondary">
            Vue d&apos;ensemble
          </LinkButton>
          <Button onClick={() => void revalidator.revalidate()}>Réessayer</Button>
        </div>
      </Card>
    </div>
  );
}
