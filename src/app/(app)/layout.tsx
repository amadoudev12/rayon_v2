import type { ComponentProps } from "react";
import { useLoaderData } from "react-router";
import { loadPage } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { PageOutlet } from "@/components/layout/PageOutlet";
import AppLoading from "./loading";

type AppShellData = Omit<ComponentProps<typeof AppShell>, "children">;

/** Compte, organisation et boutiques du cadre : relus en base par le backend à chaque chargement. */
export function loader() {
  return loadPage<AppShellData>("/shell");
}

export default function AppLayout() {
  const { user, organization, role, stores, activeStoreId } = useLoaderData<AppShellData>();

  return (
    <AppShell user={user} organization={organization} role={role} stores={stores} activeStoreId={activeStoreId}>
      <PageOutlet fallback={<AppLoading />} />
    </AppShell>
  );
}
