import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { loadPage } from "@/lib/api";
import { useSearchParamsRecord } from "@/lib/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { TableContainer, Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { formatDateTime } from "@/lib/format";
import { LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { MOVEMENT_LABELS } from "@/lib/labels";
import type { StockMovementType } from "@/generated/prisma/enums";

type StockMovementsPageData = {
  movements: {
    id: number;
    type: StockMovementType;
    variationQuantite: number;
    note: string | null;
    creeLe: string;
    produit: { id: number; nom: string; unite: string };
    utilisateur: { prenom: string; nom: string };
  }[];
  page: number;
  totalPages: number;
  total: number;
};

export function loader({ request }: LoaderFunctionArgs) {
  return loadPage<StockMovementsPageData>("/stock/mouvements", request);
}

export default function StockMovementsPage() {
  const params = useSearchParamsRecord();
  const { movements, page, totalPages, total } = useLoaderData<StockMovementsPageData>();

  return (
    <div>
      <PageHeader
        title="Historique des mouvements de stock"
        description="Chaque entrée, sortie et ajustement est tracé."
        action={
          <LinkButton href="/stock" variant="secondary">
            <Icon name="arrowLeft" className="h-4 w-4" />
            Retour au stock
          </LinkButton>
        }
      />

      <Card>
        {movements.length === 0 ? (
          <EmptyState icon="history" title="Aucun mouvement" description="Les ventes, achats et ajustements apparaîtront ici." />
        ) : (
          <TableContainer>
            <Table>
              <Thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Produit</Th>
                  <Th>Type</Th>
                  <Th className="text-right">Quantité</Th>
                  <Th>Par</Th>
                  <Th>Note</Th>
                </tr>
              </Thead>
              <tbody>
                {movements.map((movement) => {
                  const meta = MOVEMENT_LABELS[movement.type] ?? { label: movement.type, tone: "neutral" as const };
                  return (
                    <Tr key={movement.id}>
                      <Td className="whitespace-nowrap text-slate-500">{formatDateTime(movement.creeLe)}</Td>
                      <Td className="font-medium text-slate-900">{movement.produit.nom}</Td>
                      <Td>
                        <Badge dot tone={meta.tone}>{meta.label}</Badge>
                      </Td>
                      <Td className={`tabular text-right font-medium ${movement.variationQuantite < 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {movement.variationQuantite > 0 ? "+" : ""}
                        {movement.variationQuantite} {movement.produit.unite}
                      </Td>
                      <Td>
                        {movement.utilisateur.prenom} {movement.utilisateur.nom}
                      </Td>
                      <Td className="max-w-56 truncate text-slate-500">{movement.note ?? "—"}</Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableContainer>
        )}

        <Pagination basePath="/stock/mouvements" searchParams={params} page={page} totalPages={totalPages} total={total} />
      </Card>
    </div>
  );
}
