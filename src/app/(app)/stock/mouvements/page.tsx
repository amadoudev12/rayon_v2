import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { loadPage } from "@/lib/api";
import { usePathname, useRouter, useSearchParams, useSearchParamsRecord } from "@/lib/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { TableContainer, Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { formatDateTime } from "@/lib/format";
import { LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SearchInput } from "@/components/ui/SearchInput";
import { SelectFilter } from "@/components/ui/SelectFilter";
import { downloadCsv } from "@/lib/csv";
import { MOVEMENT_LABELS } from "@/lib/labels";
import type { StockMovementType } from "@/generated/prisma/enums";

type StockMovementsPageData = {
  movements: {
    id: number;
    type: StockMovementType;
    variationQuantite: number;
    quantiteAvant: number | null;
    quantiteApres: number | null;
    sourceReference: string | null;
    venteId: number | null;
    achatId: number | null;
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { movements, page, totalPages, total } = useLoaderData<StockMovementsPageData>();

  return (
    <div>
      <PageHeader
        title="Historique des mouvements de stock"
        description="Chaque entrée, sortie et ajustement est tracé."
        action={<><button className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => downloadCsv("mouvements-stock.csv", ["Date", "Produit", "Type", "Variation", "Avant", "Après", "Document", "Utilisateur", "Note"], movements.map((m) => [m.creeLe, m.produit.nom, MOVEMENT_LABELS[m.type]?.label ?? m.type, m.variationQuantite, m.quantiteAvant, m.quantiteApres, m.sourceReference ?? (m.venteId ? `Vente #${m.venteId}` : m.achatId ? `Achat #${m.achatId}` : ""), `${m.utilisateur.prenom} ${m.utilisateur.nom}`, m.note]))}>Exporter CSV</button><LinkButton href="/stock" variant="secondary"><Icon name="arrowLeft" className="h-4 w-4" />Retour au stock</LinkButton></>}
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput placeholder="Rechercher un produit…" />
          <SearchInput paramName="source" placeholder="Référence document…" />
          <SelectFilter paramName="type" placeholder="Tous les mouvements" options={[
            { value: "PURCHASE", label: "Achats" }, { value: "SALE", label: "Ventes" },
            { value: "SALE_CANCELLATION", label: "Annulations de vente" }, { value: "ADJUSTMENT", label: "Ajustements" },
            { value: "INVENTORY_ADJUSTMENT", label: "Inventaires" }, { value: "LOSS", label: "Pertes" },
            { value: "LOSS_CANCELLATION", label: "Annulations de pertes" }, { value: "INITIAL", label: "Stocks initiaux" },
          ]} />
          <label className="flex items-center gap-2 text-xs text-slate-500">Du<input aria-label="Date de début" type="date" value={searchParams.get("from") ?? ""} onChange={(event) => { const next = new URLSearchParams(searchParams); if (event.target.value) next.set("from", event.target.value); else next.delete("from"); next.delete("page"); router.push(`${pathname}?${next.toString()}`); }} className="rounded-md border p-1.5 text-sm text-slate-700" /></label>
          <label className="flex items-center gap-2 text-xs text-slate-500">Au<input aria-label="Date de fin" type="date" value={searchParams.get("to") ?? ""} onChange={(event) => { const next = new URLSearchParams(searchParams); if (event.target.value) next.set("to", `${event.target.value}T23:59:59.999`); else next.delete("to"); next.delete("page"); router.push(`${pathname}?${next.toString()}`); }} className="rounded-md border p-1.5 text-sm text-slate-700" /></label>
        </div>
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
                  <Th className="text-right">Avant → Après</Th>
                  <Th>Document</Th>
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
                      <Td className="tabular text-right text-slate-600">{movement.quantiteAvant === null || movement.quantiteApres === null ? "—" : `${movement.quantiteAvant} → ${movement.quantiteApres}`}</Td>
                      <Td className="text-slate-600">{movement.sourceReference ?? (movement.venteId ? `Vente #${movement.venteId}` : movement.achatId ? `Achat #${movement.achatId}` : "—")}</Td>
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
