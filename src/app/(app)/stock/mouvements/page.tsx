import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { loadPage } from "@/lib/api";
import { usePathname, useRouter, useSearchParams, useSearchParamsRecord } from "@/lib/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { ExportLink } from "@/components/ui/ExportLink";
import { TableContainer, Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { documentNumber, formatDateTime } from "@/lib/format";
import { LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SearchInput } from "@/components/ui/SearchInput";
import { SelectFilter } from "@/components/ui/SelectFilter";
import { MOVEMENT_LABELS } from "@/lib/labels";
import type { StockMovementType } from "@/generated/prisma/enums";

type Movement = {
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
};

type StockMovementsPageData = {
  movements: Movement[];
  page: number;
  totalPages: number;
  total: number;
  /** Période filtrée (jours dans le fuseau de l'organisation), ou null : tout l'historique. */
  period: { from: string; to: string } | null;
};

export function loader({ request }: LoaderFunctionArgs) {
  return loadPage<StockMovementsPageData>("/stock/mouvements", request);
}

const TYPE_OPTIONS = Object.entries(MOVEMENT_LABELS).map(([value, meta]) => ({ value, label: meta.label }));

/** Filtres repris tels quels par l'export (sans la pagination). */
const EXPORT_FILTERS = ["search", "source", "type", "periode", "du", "au"];

function documentOf(movement: Movement) {
  if (movement.sourceReference) return movement.sourceReference;
  if (movement.venteId) return documentNumber("VTE", movement.venteId);
  if (movement.achatId) return documentNumber("ACH", movement.achatId);
  return "—";
}

export default function StockMovementsPage() {
  const params = useSearchParamsRecord();
  const { movements, page, totalPages, total, period } = useLoaderData<StockMovementsPageData>();

  const exportQuery = new URLSearchParams(Object.entries(params).filter(([key]) => EXPORT_FILTERS.includes(key)));

  return (
    <div>
      <PageHeader
        title="Historique des mouvements de stock"
        description="Chaque entrée, sortie et ajustement est tracé, avec le stock avant et après."
        action={
          <>
            <ExportLink path={`/api/exports/movements?${exportQuery.toString()}`} label={period ? "Exporter la période" : "Exporter ce mois-ci"} />
            <LinkButton href="/stock" variant="secondary">
              <Icon name="arrowLeft" className="h-4 w-4" />
              Retour au stock
            </LinkButton>
          </>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:flex-wrap lg:items-center">
          <SearchInput placeholder="Rechercher un produit…" />
          <SearchInput paramName="source" placeholder="Référence du document…" />
          <SelectFilter paramName="type" placeholder="Tous les mouvements" options={TYPE_OPTIONS} />
          <DateRangeFilter />
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
                  const hasBalance = movement.quantiteAvant !== null && movement.quantiteApres !== null;
                  return (
                    <Tr key={movement.id}>
                      <Td className="whitespace-nowrap text-slate-500">{formatDateTime(movement.creeLe)}</Td>
                      <Td className="font-medium text-slate-900">{movement.produit.nom}</Td>
                      <Td>
                        <Badge dot tone={meta.tone}>
                          {meta.label}
                        </Badge>
                      </Td>
                      <Td className={`tabular text-right font-medium ${movement.variationQuantite < 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {movement.variationQuantite > 0 ? "+" : ""}
                        {movement.variationQuantite} {movement.produit.unite}
                      </Td>
                      <Td className="tabular text-right text-slate-600">{hasBalance ? `${movement.quantiteAvant} → ${movement.quantiteApres}` : "—"}</Td>
                      <Td className="text-slate-600">{documentOf(movement)}</Td>
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

/**
 * Période « du … au … ». Les jours sont interprétés par le serveur dans le
 * fuseau de l'organisation (une vente à 23 h 30 reste sur le bon jour).
 */
function DateRangeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const from = searchParams.get("du") ?? "";
  const to = searchParams.get("au") ?? "";

  function apply(nextFrom: string, nextTo: string) {
    const next = new URLSearchParams(searchParams);
    next.delete("page");
    const start = nextFrom || nextTo;
    const end = nextTo || nextFrom;
    if (!start) {
      next.delete("periode");
      next.delete("du");
      next.delete("au");
    } else {
      next.set("periode", "custom");
      // Dates inversées : on les remet dans l'ordre plutôt que de refuser.
      next.set("du", start <= end ? start : end);
      next.set("au", start <= end ? end : start);
    }
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <label className="flex items-center gap-1.5">
        Du
        <input
          aria-label="Date de début"
          type="date"
          value={from}
          onChange={(event) => apply(event.target.value, to)}
          className="h-9 rounded-lg border border-slate-200 px-2 text-sm text-slate-700"
        />
      </label>
      <label className="flex items-center gap-1.5">
        au
        <input
          aria-label="Date de fin"
          type="date"
          value={to}
          onChange={(event) => apply(from, event.target.value)}
          className="h-9 rounded-lg border border-slate-200 px-2 text-sm text-slate-700"
        />
      </label>
    </div>
  );
}
