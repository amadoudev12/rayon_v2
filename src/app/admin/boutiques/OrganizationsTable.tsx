import { Link } from "@/lib/navigation";
import { useRouter } from "@/lib/navigation";
import { TableContainer, Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { SortableTh } from "@/components/admin/SortableTh";
import { OrganizationStatusBadge } from "@/components/admin/parts";
import { OrganizationStatusButton } from "@/components/admin/StatusActions";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { userContact } from "@/lib/auth/identifier";
import type { OrganizationStatus } from "@/lib/services/platform";

export type OrganizationRow = {
  id: number;
  nom: string;
  devise: string;
  actif: boolean;
  creeLe: string | Date;
  owner: { prenom: string; nom: string; email: string | null; telephone: string | null } | null;
  stores: number;
  products: number;
  sales: number;
  revenue: number;
  status: OrganizationStatus;
  /** Durée écoulée depuis la dernière activité (« il y a 3 jours »), calculée par la page. */
  lastActivityLabel: string | null;
};

export function OrganizationsTable({ organizations, filtered }: { organizations: OrganizationRow[]; filtered: boolean }) {
  const router = useRouter();

  if (organizations.length === 0) {
    return filtered ? (
      <EmptyState icon="search" title="Aucune boutique ne correspond" description="Modifiez la recherche ou le filtre de statut." />
    ) : (
      <EmptyState
        icon="store"
        title="Aucune boutique sur la plateforme"
        description="Les boutiques créées par les commerçants, ou par vous, apparaîtront ici."
      />
    );
  }

  return (
    <TableContainer>
      <Table>
        <Thead>
          <tr>
            <SortableTh field="nom" fallbackField="creeLe" defaultOrder="asc">
              Boutique
            </SortableTh>
            <Th>Propriétaire</Th>
            <SortableTh field="products" fallbackField="creeLe" align="right">
              Produits
            </SortableTh>
            <SortableTh field="sales" fallbackField="creeLe" align="right">
              Ventes
            </SortableTh>
            <SortableTh field="revenue" fallbackField="creeLe" align="right">
              CA
            </SortableTh>
            <Th>Statut</Th>
            <SortableTh field="creeLe" fallbackField="creeLe">
              Inscription
            </SortableTh>
            <SortableTh field="lastActivity" fallbackField="creeLe">
              Dernière activité
            </SortableTh>
            <Th className="sm:sticky sm:right-0 bg-slate-50 text-right sm:shadow-[-1px_0_0_0_rgb(226_232_240/0.8)]">Actions</Th>
          </tr>
        </Thead>
        <tbody>
          {organizations.map((organization) => (
            <Tr key={organization.id} onClick={() => router.push(`/admin/boutiques/${organization.id}`)}>
              <Td>
                <Link
                  href={`/admin/boutiques/${organization.id}`}
                  onClick={(event) => event.stopPropagation()}
                  className="block max-w-56 truncate font-medium text-slate-900 hover:text-brand-700"
                >
                  {organization.nom}
                </Link>
                <p className="whitespace-nowrap text-xs text-slate-500">
                  {organization.stores} point(s) de vente · {organization.devise}
                </p>
              </Td>
              <Td>
                {organization.owner ? (
                  <>
                    <p className="max-w-48 truncate text-slate-900">
                      {organization.owner.prenom} {organization.owner.nom}
                    </p>
                    <p className="max-w-48 truncate text-xs text-slate-500">{userContact(organization.owner)}</p>
                  </>
                ) : (
                  <span className="text-slate-400">Aucun propriétaire</span>
                )}
              </Td>
              <Td className="tabular text-right">{formatNumber(organization.products)}</Td>
              <Td className="tabular text-right">{formatNumber(organization.sales)}</Td>
              <Td className="tabular whitespace-nowrap text-right font-medium text-slate-900">
                {formatMoney(organization.revenue, organization.devise)}
              </Td>
              <Td>
                <OrganizationStatusBadge status={organization.status} />
              </Td>
              <Td className="whitespace-nowrap text-slate-500">{formatDate(organization.creeLe)}</Td>
              <Td className="whitespace-nowrap text-slate-500">{organization.lastActivityLabel ?? "Jamais"}</Td>
              {/* Le détail s'ouvre en cliquant la ligne (ou le nom, au clavier). */}
              <Td className="sm:sticky sm:right-0 whitespace-nowrap bg-white text-right sm:shadow-[-1px_0_0_0_rgb(241_245_249)]">
                <OrganizationStatusButton organization={organization} compact />
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </TableContainer>
  );
}
