import type { ComponentProps } from "react";
import { useLoaderData } from "react-router";
import { loadPage } from "@/lib/api";
import { Role } from "@/generated/prisma/enums";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { OrganizationForm } from "./OrganizationForm";
import { StoresSection } from "./StoresSection";
import { TeamSection } from "./TeamSection";

type SettingsPageData = {
  organization: ComponentProps<typeof OrganizationForm>["organization"];
  stores: ComponentProps<typeof StoresSection>["stores"];
  members: ComponentProps<typeof TeamSection>["members"];
  currentUserId: number;
  canEditOrganization: boolean;
  canManageStores: boolean;
};

export function loader() {
  return loadPage<SettingsPageData>("/parametres");
}

/** Section de réglages : titre et explication à gauche, contenu à droite (sur grand écran). */
function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid grid-cols-1 gap-4 border-t border-slate-200/80 pt-8 first:border-t-0 first:pt-0 lg:grid-cols-3 lg:gap-8">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-[13px] text-slate-500">{description}</p>
      </div>
      <Card className="overflow-hidden lg:col-span-2">{children}</Card>
    </section>
  );
}

export default function SettingsPage() {
  const { organization, stores, members, currentUserId, canEditOrganization, canManageStores } =
    useLoaderData<SettingsPageData>();

  return (
    <div>
      <PageHeader title="Paramètres" description="Organisation, boutiques et équipe." />

      <div className="space-y-8">
        <SettingsSection title="Organisation" description="Nom et devise utilisés dans toute l'application.">
          <OrganizationForm organization={organization} canEdit={canEditOrganization} />
        </SettingsSection>

        <SettingsSection title="Boutiques" description="Chaque boutique a son propre stock et ses propres ventes.">
          <StoresSection stores={stores} canManage={canManageStores} />
        </SettingsSection>

        <SettingsSection title="Équipe" description="Les personnes qui ont accès à votre organisation.">
          <TeamSection members={members} stores={stores} currentUserId={currentUserId} ownerRole={Role.OWNER} />
        </SettingsSection>
      </div>
    </div>
  );
}
