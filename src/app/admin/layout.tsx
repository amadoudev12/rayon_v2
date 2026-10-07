import type { ComponentProps } from "react";
import { useLoaderData } from "react-router";
import { loadPage } from "@/lib/api";
import { useDocumentTitle } from "@/lib/document";
import { AdminShell } from "@/components/layout/AdminShell";
import { PageOutlet } from "@/components/layout/PageOutlet";
import AdminLoading from "./loading";

type AdminShellData = Omit<ComponentProps<typeof AdminShell>, "children">;

/**
 * Statut de super administrateur relu en base par le backend : tout autre
 * compte est redirigé. Chaque page revérifie de son côté.
 */
export function loader() {
  return loadPage<AdminShellData>("/admin/shell");
}

export default function AdminLayout() {
  const { user, alerts } = useLoaderData<AdminShellData>();
  useDocumentTitle("Administration · Rayon");

  return (
    <AdminShell user={user} alerts={alerts}>
      <PageOutlet fallback={<AdminLoading />} />
    </AdminShell>
  );
}
