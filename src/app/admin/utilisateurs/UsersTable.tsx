import { Link } from "@/lib/navigation";
import { TableContainer, Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { SortableTh } from "@/components/admin/SortableTh";
import { UserStatusButton } from "@/components/admin/StatusActions";
import { formatDate, initials } from "@/lib/format";
import { userContact } from "@/lib/auth/identifier";

export type UserRow = {
  id: number;
  prenom: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  superAdmin: boolean;
  actif: boolean;
  creeLe: string | Date;
  /** Libellé du rôle ; null quand le compte n'a pas encore de boutique. */
  roleLabel: string | null;
  organization: { id: number; nom: string; actif: boolean } | null;
  storeName: string | null;
  /** Durée écoulée depuis la dernière activité (« il y a 3 jours »), calculée par la page. */
  lastActivityLabel: string | null;
};

export function UsersTable({ users, filtered }: { users: UserRow[]; filtered: boolean }) {
  if (users.length === 0) {
    return filtered ? (
      <EmptyState icon="search" title="Aucun utilisateur ne correspond" description="Modifiez la recherche ou les filtres." />
    ) : (
      <EmptyState icon="users" title="Aucun utilisateur" description="Les comptes inscrits sur la plateforme apparaîtront ici." />
    );
  }

  return (
    <TableContainer>
      <Table>
        <Thead>
          <tr>
            <SortableTh field="nom" fallbackField="creeLe" defaultOrder="asc">
              Utilisateur
            </SortableTh>
            <Th>Rôle</Th>
            <Th>Boutique</Th>
            <Th>Statut</Th>
            <SortableTh field="creeLe" fallbackField="creeLe">
              Inscription
            </SortableTh>
            <SortableTh field="derniereActiviteLe" fallbackField="creeLe">
              Dernière activité
            </SortableTh>
            <Th className="sm:sticky sm:right-0 bg-slate-50 text-right sm:shadow-[-1px_0_0_0_rgb(226_232_240/0.8)]">Actions</Th>
          </tr>
        </Thead>
        <tbody>
          {users.map((user) => (
            <Tr key={user.id}>
              <Td>
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ring-1 ring-inset ${
                      user.superAdmin ? "bg-slate-900 text-white ring-slate-900" : "bg-slate-100 text-slate-600 ring-slate-200/70"
                    }`}
                  >
                    {initials(user.prenom, user.nom)}
                  </span>
                  <div className="min-w-0">
                    <p className="max-w-52 truncate font-medium text-slate-900">
                      {user.prenom} {user.nom}
                    </p>
                    <p className="max-w-52 truncate text-xs text-slate-500">{userContact(user)}</p>
                  </div>
                </div>
              </Td>
              <Td>
                {user.superAdmin ? (
                  <Badge tone="brand">Super administrateur</Badge>
                ) : user.roleLabel ? (
                  <Badge>{user.roleLabel}</Badge>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </Td>
              <Td>
                {user.organization ? (
                  <>
                    <Link
                      href={`/admin/boutiques/${user.organization.id}`}
                      className="block max-w-48 truncate text-slate-900 hover:text-brand-700 hover:underline"
                    >
                      {user.organization.nom}
                    </Link>
                    <p className="max-w-48 truncate text-xs text-slate-500">
                      {!user.organization.actif ? "Boutique suspendue" : (user.storeName ?? "Tous les points de vente")}
                    </p>
                  </>
                ) : user.superAdmin ? (
                  <span className="text-slate-500">Plateforme</span>
                ) : (
                  <span className="text-slate-400">Inscription inachevée</span>
                )}
              </Td>
              <Td>
                <Badge dot tone={user.actif ? "success" : "danger"}>
                  {user.actif ? "Actif" : "Désactivé"}
                </Badge>
              </Td>
              <Td className="whitespace-nowrap text-slate-500">{formatDate(user.creeLe)}</Td>
              <Td className="whitespace-nowrap text-slate-500">{user.lastActivityLabel ?? "Jamais"}</Td>
              <Td className="sm:sticky sm:right-0 whitespace-nowrap bg-white text-right sm:shadow-[-1px_0_0_0_rgb(241_245_249)]">
                {/* Les comptes super administrateur ne se désactivent pas depuis l'interface. */}
                {!user.superAdmin && <UserStatusButton user={user} compact />}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </TableContainer>
  );
}
