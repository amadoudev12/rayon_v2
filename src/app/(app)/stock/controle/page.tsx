import { useState } from "react";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { loadPage } from "@/lib/api";
import { useSearchParamsRecord } from "@/lib/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { inputClass } from "@/components/ui/FormField";
import { TableContainer, Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { useToast } from "@/components/ui/ToastProvider";
import { sendJson } from "@/lib/mutation";
import { STOCK_LEVEL } from "@/lib/labels";

type Level = "OUT" | "LOW" | "NORMAL";
type StockAlert =
  | { type: "STOCK"; produitId: number; produit: string; quantite: number; seuilAlerte: number; niveau: Level }
  | { type: "REPEATED_LOSS"; produitId: number; produit: string; quantite: number; seuilAlerte: number; niveau: "REPEATED_LOSS"; occurrences: number };
type StockRow = { id: number; produitId: number; quantite: number; seuilAlerte: number; niveau: Level; produit: { nom: string; unite: string } };

type StockControlPageData = {
  store: { id: number; nom: string };
  alerts: StockAlert[];
  rows: StockRow[];
  canManageThresholds: boolean;
  page: number;
  totalPages: number;
  total: number;
};

export function loader({ request }: LoaderFunctionArgs) {
  return loadPage<StockControlPageData>("/stock/controle", request);
}

/** Ruptures, stocks faibles, pertes répétées et seuils d'alerte de la boutique active. */
export default function StockControlPage() {
  const params = useSearchParamsRecord();
  const { store, alerts, rows, canManageThresholds, page, totalPages, total } = useLoaderData<StockControlPageData>();
  const stockAlerts = alerts.filter((alert): alert is Extract<StockAlert, { type: "STOCK" }> => alert.type === "STOCK");
  const lossAlerts = alerts.filter((alert): alert is Extract<StockAlert, { type: "REPEATED_LOSS" }> => alert.type === "REPEATED_LOSS");

  return (
    <div className="space-y-6">
      <PageHeader title="Alertes et seuils de stock" description={`Boutique ${store.nom}. Le seuil propre à la boutique est prioritaire sur le seuil par défaut du produit.`} />

      <Card>
        <h2 className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-900">Ruptures et stocks faibles ({stockAlerts.length})</h2>
        {stockAlerts.length === 0 ? (
          <EmptyState compact icon="checkCircle" title="Aucune rupture ni stock faible" />
        ) : (
          <TableContainer>
            <Table>
              <Thead>
                <tr>
                  <Th>Produit</Th>
                  <Th className="text-right">Disponible</Th>
                  <Th className="text-right">Seuil</Th>
                  <Th>État</Th>
                </tr>
              </Thead>
              <tbody>
                {stockAlerts.map((alert) => (
                  <Tr key={alert.produitId}>
                    <Td className="font-medium text-slate-900">{alert.produit}</Td>
                    <Td className="tabular text-right">{alert.quantite}</Td>
                    <Td className="tabular text-right">{alert.seuilAlerte}</Td>
                    <Td>
                      <Badge dot tone={STOCK_LEVEL[alert.niveau].tone}>
                        {STOCK_LEVEL[alert.niveau].label}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Card>
        <h2 className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-900">Pertes répétées sur 30 jours</h2>
        {lossAlerts.length === 0 ? (
          <EmptyState compact icon="checkCircle" title="Aucune série de pertes" description="Un produit est signalé à partir de 3 déclarations actives en 30 jours." />
        ) : (
          <TableContainer>
            <Table>
              <Thead>
                <tr>
                  <Th>Produit</Th>
                  <Th className="text-right">Déclarations</Th>
                  <Th className="text-right">Quantité perdue</Th>
                </tr>
              </Thead>
              <tbody>
                {lossAlerts.map((alert) => (
                  <Tr key={alert.produitId}>
                    <Td className="font-medium text-slate-900">{alert.produit}</Td>
                    <Td className="tabular text-right">{alert.occurrences}</Td>
                    <Td className="tabular text-right">{alert.quantite}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Seuils d&apos;alerte</h2>
          <SearchInput placeholder="Rechercher un produit…" />
        </div>
        {rows.length === 0 ? (
          <EmptyState compact icon="box" title="Aucun produit" />
        ) : (
          <>
            <TableContainer>
              <Table>
                <Thead>
                  <tr>
                    <Th>Produit</Th>
                    <Th className="text-right">Stock</Th>
                    <Th>Seuil</Th>
                  </tr>
                </Thead>
                <tbody>
                  {rows.map((row) => (
                    <Tr key={row.id}>
                      <Td className="font-medium text-slate-900">{row.produit.nom}</Td>
                      <Td className="tabular text-right">
                        {row.quantite} {row.produit.unite}
                      </Td>
                      <Td>{canManageThresholds ? <ThresholdInput row={row} /> : row.seuilAlerte}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
            <Pagination basePath="/stock/controle" searchParams={params} page={page} totalPages={totalPages} total={total} />
          </>
        )}
      </Card>
    </div>
  );
}

/** Modification du seuil d'un produit pour la boutique active. */
function ThresholdInput({ row }: { row: StockRow }) {
  const { push } = useToast();
  const [value, setValue] = useState(String(row.seuilAlerte));
  const [saved, setSaved] = useState(String(row.seuilAlerte));
  const [busy, setBusy] = useState(false);
  const amount = Number(value);
  const valid = value !== "" && Number.isInteger(amount) && amount >= 0 && amount <= 1_000_000;

  async function save() {
    if (!valid) return;
    setBusy(true);
    const result = await sendJson("/api/stock/threshold", { produitId: row.produitId, seuilAlerte: amount }, { method: "PUT" });
    setBusy(false);
    if (!result.ok) return push(result.message, "error");
    setSaved(value);
    push(`Seuil de « ${row.produit.nom} » : ${amount}`, "success");
  }

  return (
    <div className="flex items-center gap-2">
      <input
        aria-label={`Seuil d'alerte de ${row.produit.nom}`}
        type="number"
        min={0}
        step={1}
        inputMode="numeric"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className={`${inputClass} w-24`}
      />
      <Button size="sm" variant="secondary" loading={busy} disabled={!valid || value === saved} onClick={() => void save()}>
        Enregistrer
      </Button>
    </div>
  );
}
