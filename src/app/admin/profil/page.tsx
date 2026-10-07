import { useLoaderData } from "react-router";
import { loadPage } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { formatDate, initials } from "@/lib/format";
import { userContact } from "@/lib/auth/identifier";
import { ProfileForm } from "./ProfileForm";

type AdminProfilePageData = {
  user: { prenom: string; nom: string; email: string | null; telephone: string | null; creeLe: string };
  superAdmins: { id: number; prenom: string; nom: string; email: string | null; telephone: string | null; actif: boolean }[];
  currentUserId: number;
};

export function loader() {
  return loadPage<AdminProfilePageData>("/admin/profil");
}

export default function AdminProfilePage() {
  const { user, superAdmins, currentUserId } = useLoaderData<AdminProfilePageData>();

  return (
    <div>
      <PageHeader title="Mon profil" description={`Compte super administrateur · créé le ${formatDate(user.creeLe, { dateStyle: "long" })}`} />

      <div className="space-y-8">
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Informations personnelles</h2>
            <p className="mt-1 text-[13px] text-slate-500">Votre nom tel qu&apos;il apparaît dans le journal d&apos;activité, et votre mot de passe.</p>
          </div>
          <Card className="overflow-hidden lg:col-span-2">
            <ProfileForm user={{ prenom: user.prenom, nom: user.nom, identifiant: userContact(user) }} />
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-4 border-t border-slate-200/80 pt-8 lg:grid-cols-3 lg:gap-8">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Accès à l&apos;administration</h2>
            <p className="mt-1 text-[13px] text-slate-500">
              Comptes pouvant administrer la plateforme. Pour des raisons de sécurité, un super administrateur ne se crée
              qu&apos;en ligne de commande (<code className="rounded bg-slate-100 px-1 py-0.5 text-xs">npm run admin:create</code>), jamais depuis l&apos;interface.
            </p>
          </div>
          <Card className="overflow-hidden lg:col-span-2">
            <ul className="divide-y divide-slate-100">
              {superAdmins.map((account) => (
                <li key={account.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                    {initials(account.prenom, account.nom)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {account.prenom} {account.nom}
                      {account.id === currentUserId && <span className="ml-2 text-xs font-normal text-slate-400">vous</span>}
                    </p>
                    <p className="truncate text-xs text-slate-500">{userContact(account)}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-200/70">
                    <Icon name="shield" className="h-3 w-3" />
                    Super administrateur
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>
    </div>
  );
}
