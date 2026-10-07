import { Outlet } from "react-router";
import { AuthShell } from "@/components/layout/AuthShell";

export default function AuthLayout() {
  return (
    <AuthShell title="Gestion de magasin" subtitle="La gestion de votre commerce, simplifiée.">
      <Outlet />
    </AuthShell>
  );
}
