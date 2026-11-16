import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { loadPage } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExportLink } from "@/components/ui/ExportLink";
import { SelectFilter } from "@/components/ui/SelectFilter";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { TableContainer, Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { downloadCsv } from "@/lib/csv";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";

/** Montants exacts envoyés par le serveur sous forme de texte décimal (« 1234.5 »). */
type Amount = string;

type StockReportsPageData = {
  store: { id: number; nom: string };
  currency: string;
  valuation: {
    lignes: { produitId: number; produit: string; reference: string | null; unite: string; quantite: number; coutUnitaire: Amount; valeur: Amount }[];
    produits: number;
    quantiteTotale: number;
    valeurTotale: Amount;
    detailComplet: boolean;
    methode: string;
  };
  losses: {
    declarations: number;
    quantiteTotale: number;
    valeurTotale: Amount;
    parMotif: { motif: string; libelle: string; declarations: number; quantite: number; valeur: Amount }[];
    parProduit: { produitId: number; produit: string; declarations: number; quantite: number; valeur: Amount }[];
  };
  period: { key: string; from: string; to: string };
};

export function loader({ request }: LoaderFunctionArgs) {
  return loadPage<StockReportsPageData>("/stock/rapports", request);
}

const PERIODS = [
  { value: "today", label: "Aujourd'hui" },
  { value: "yesterday", label: "Hier" },
  { value: "week", label: "Cette semaine" },
];

/** Texte décimal du serveur → nombre pour l'affichage (les calculs restent faits côté serveur). */
const money = (value: Amount, currency: string) => formatMoney(Number(value), currency);
/** Montant au format d'Excel en français, sans passer par un nombre flottant. */
const csvAmount = (value: Amount) => value.replace(".", ",");

/** Valorisation du stock actuel et pertes de la période, pour la boutique active. */
export default function StockReportsPage() {
  const { store, currency, valuation, losses, period } = useLoaderData<StockReportsPageData>();
  const periodLabel = period.from === period.to ? formatDate(period.from) : `du ${formatDate(period.from)} au ${formatDate(period.to)}`;

  function exportLosses() {
    downloadCsv(
      `pertes-${period.from}-${period.to}.csv`,
      ["Produit", "Déclarations", "Quantité", "Valeur"],
      losses.parProduit.map((row) => [row.produit, row.declarations, row.quantite, csvAmount(row.valeur)]),
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Valorisation et pertes"
        description={`Boutique ${store.nom}. ${valuation.methode}`}
        action={<ExportLink path="/api/exports/stock" label="Exporter tout le stock" />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Valeur du stock</p>
          <p className="tabular mt-1 text-2xl font-semibold text-slate-900">{money(valuation.valeurTotale, currency)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Unités en stock</p>
          <p className="tabular mt-1 text-2xl font-semibold text-slate-900">{formatNumber(valuation.quantiteTotale)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Produits en stock</p>
          <p className="tabular mt-1 text-2xl font-semibold text-slate-900">{formatNumber(valuation.produits)}</p>
        </Card>
      </div>

      <Card>
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Produits les plus coûteux en stock</h2>
          {!valuation.detailComplet && (
            <p className="mt-0.5 text-xs text-slate-500">Les {valuation.lignes.length} premiers produits sont détaillés ; l&apos;export contient tout le stock.</p>
          )}
        </div>
        {valuation.lignes.length === 0 ? (
          <EmptyState compact icon="box" title="Aucun produit en stock" />
        ) : (
          <TableContainer>
            <Table>
              <Thead>
                <tr>
                  <Th>Produit</Th>
                  <Th className="text-right">Quantité</Th>
                  <Th className="text-right">Coût unitaire</Th>
                  <Th className="text-right">Valeur</Th>
                </tr>
              </Thead>
              <tbody>
                {valuation.lignes.map((line) => (
                  <Tr key={line.produitId}>
                    <Td className="font-medium text-slate-900">
                      {line.produit}
                      {line.reference && <span className="block text-xs font-normal text-slate-500">Réf. {line.reference}</span>}
                    </Td>
                    <Td className="tabular text-right">
                      {formatNumber(line.quantite)} {line.unite}
                    </Td>
                    <Td className="tabular text-right">{money(line.coutUnitaire, currency)}</Td>
                    <Td className="tabular text-right font-medium">{money(line.valeur, currency)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Pertes {period.key === "month" ? "du mois" : periodLabel}</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {formatNumber(losses.declarations)} déclaration(s) · {formatNumber(losses.quantiteTotale)} unité(s) · {money(losses.valeurTotale, currency)} au coût
              d&apos;achat
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SelectFilter paramName="periode" placeholder="Ce mois-ci" options={PERIODS} />
            <Button variant="secondary" size="sm" disabled={losses.parProduit.length === 0} onClick={exportLosses}>
              <Icon name="download" className="h-4 w-4" />
              Exporter
            </Button>
          </div>
        </div>
        {losses.declarations === 0 ? (
          <EmptyState compact icon="checkCircle" title="Aucune perte sur la période" />
        ) : (
          <div className="grid gap-6 p-5 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Par motif</h3>
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200/80 text-sm">
                {losses.parMotif.map((row) => (
                  <li key={row.motif} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span>
                      {row.libelle}
                      <span className="block text-xs text-slate-500">
                        {row.declarations} déclaration(s) · {row.quantite} unité(s)
                      </span>
                    </span>
                    <span className="tabular font-medium">{money(row.valeur, currency)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Par produit</h3>
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200/80 text-sm">
                {losses.parProduit.map((row) => (
                  <li key={row.produitId} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span>
                      {row.produit}
                      <span className="block text-xs text-slate-500">
                        {row.declarations} déclaration(s) · {row.quantite} unité(s)
                      </span>
                    </span>
                    <span className="tabular font-medium">{money(row.valeur, currency)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
