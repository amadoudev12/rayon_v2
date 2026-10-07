import { useEffect } from "react";
import { Outlet, ScrollRestoration, isRouteErrorResponse, useRouteError } from "react-router";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import NotFound from "./not-found";

/** Racine du site : notifications disponibles partout, retour en haut de page à chaque navigation. */
export default function RootLayout() {
  return (
    <ToastProvider>
      <Outlet />
      <ScrollRestoration />
    </ToastProvider>
  );
}

/** Dernier recours : page introuvable, ou erreur hors des espaces application et administration. */
export function RootError() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  useEffect(() => {
    if (!notFound) console.error(error);
  }, [error, notFound]);

  if (notFound) return <NotFound />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-inset ring-red-200/70">
          <Icon name="alertCircle" className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-slate-900">Une erreur est survenue</h2>
        <p className="mt-1 text-sm text-slate-500">
          Cette page n&apos;a pas pu s&apos;afficher correctement. Vous pouvez réessayer.
        </p>
        <div className="mt-6 flex justify-center">
          <a
            href=""
            className="inline-flex h-9 items-center justify-center rounded-lg bg-brand-600 px-3.5 text-sm font-medium text-white shadow-xs transition-colors hover:bg-brand-700"
          >
            Réessayer
          </a>
        </div>
      </Card>
    </div>
  );
}
