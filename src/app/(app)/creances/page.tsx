import { useState } from "react";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { loadPage } from "@/lib/api";
import { Link, useRouter, useSearchParamsRecord } from "@/lib/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/dashboard/StatCard";
import { TableContainer, Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { documentNumber, formatDate, formatMoney, formatNumber } from "@/lib/format";
import { SaleDetailsModal } from "../ventes/SaleDetailsModal";
import { PaymentModal, type PaymentTarget } from "./PaymentModal";

type Credit = {
  id: number;
  total: number;
  montantPaye: number;
  resteAPayer: number;
  creeLe: string;
  dernierPaiement: string | null;
  client: { id: number; nom: string; telephone: string | null } | null;
};

type CreditsPageData = {
  credits: Credit[];
  summary: { outstanding: number; count: number };
  canCollect: boolean;
  currency: string;
  page: number;
  totalPages: number;
  total: number;
};

export function loader({ request }: LoaderFunctionArgs) {
  return loadPage<CreditsPageData>("/creances", request);
}

const STATUS_FILTERS = [
  { value: "en_cours", label: "En cours" },
  { value: "reglee", label: "Réglées" },
  { value: "toutes", label: "Toutes" },
];

export default function CreditsPage() {
  const params = useSearchParamsRecord();
  const router = useRouter();
  const { credits, summary, canCollect, currency, page, totalPages, total } = useLoaderData<CreditsPageData>();
  const status = params.statut ?? "en_cours";
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [paying, setPaying] = useState<PaymentTarget | null>(null);

  function filterHref(value: string) {
    const next = new URLSearchParams(params);
    if (value === "en_cours") next.delete("statut");
    else next.set("statut", value);
    next.delete("page");
    return `/creances?${next.toString()}`;
  }

  return (
    <div>
      <PageHeader
        title="Créances"
        description="Ventes à crédit de la boutique : ce que chaque client a payé et ce qu'il doit encore."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Créances en cours"
          icon="coins"
          value={formatMoney(summary.outstanding, currency)}
          tone={summary.outstanding > 0 ? "warning" : "default"}
          hint="Reste à encaisser, toutes dates confondues"
        />
        <StatCard
          label="Ventes à encaisser"
          icon="receipt"
          value={formatNumber(summary.count)}
          hint={summary.count > 0 ? "Clients avec un reste à payer" : "Aucune créance en cours"}
        />
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-xs" role="group" aria-label="Statut">
            {STATUS_FILTERS.map((filter) => (
              <Link
                key={filter.value}
                href={filterHref(filter.value)}
                aria-current={status === filter.value ? "true" : undefined}
                className={`rounded-md px-2.5 py-1 text-[13px] font-medium transition-colors duration-150 ${
                  status === filter.value ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {filter.label}
              </Link>
            ))}
          </div>
          <div className="sm:w-72">
            <SearchInput placeholder="Rechercher un client…" />
          </div>
        </div>

        {credits.length === 0 ? (
          <EmptyState
            icon="coins"
            title={status === "en_cours" ? "Aucune créance en cours" : "Aucune créance"}
            description="Les ventes enregistrées en « Crédit client » apparaîtront ici."
          />
        ) : (
          <TableContainer>
            <Table>
              <Thead>
                <tr>
                  <Th>Client</Th>
                  <Th>Vente</Th>
                  <Th>Date</Th>
                  <Th className="text-right">Total</Th>
                  <Th className="text-right">Déjà payé</Th>
                  <Th className="text-right">Reste à payer</Th>
                  <Th>Statut</Th>
                  {canCollect && <Th className="text-right">Actions</Th>}
                </tr>
              </Thead>
              <tbody>
                {credits.map((credit) => {
                  const settled = credit.resteAPayer <= 0;
                  return (
                    <Tr key={credit.id} onClick={() => setViewingId(credit.id)}>
                      <Td className="min-w-48 font-medium text-slate-900">
                        {credit.client?.nom ?? "Client de passage"}
                        {credit.client?.telephone && <span className="block text-xs font-normal text-slate-500">{credit.client.telephone}</span>}
                      </Td>
                      <Td className="tabular whitespace-nowrap">{documentNumber("VTE", credit.id)}</Td>
                      <Td className="whitespace-nowrap text-slate-500">
                        {formatDate(credit.creeLe)}
                        {credit.dernierPaiement && (
                          <span className="block text-xs text-slate-400">Dernier versement : {formatDate(credit.dernierPaiement)}</span>
                        )}
                      </Td>
                      <Td className="tabular text-right">{formatMoney(credit.total, currency)}</Td>
                      <Td className="tabular text-right">{formatMoney(credit.montantPaye, currency)}</Td>
                      <Td className={`tabular text-right font-semibold ${settled ? "text-slate-400" : "text-amber-700"}`}>
                        {formatMoney(credit.resteAPayer, currency)}
                      </Td>
                      <Td>
                        <Badge dot tone={settled ? "success" : "warning"}>
                          {settled ? "Réglée" : "En cours"}
                        </Badge>
                      </Td>
                      {canCollect && (
                        <Td className="text-right">
                          {!settled && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setPaying({
                                  id: credit.id,
                                  clientName: credit.client?.nom ?? "Client",
                                  total: credit.total,
                                  paid: credit.montantPaye,
                                });
                              }}
                              className="whitespace-nowrap rounded-md px-2 py-1 text-[13px] font-medium text-brand-700 transition-colors hover:bg-brand-50"
                            >
                              Enregistrer un paiement
                            </button>
                          )}
                        </Td>
                      )}
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableContainer>
        )}

        <Pagination basePath="/creances" searchParams={params} page={page} totalPages={totalPages} total={total} />
      </Card>

      <SaleDetailsModal
        saleId={viewingId}
        currency={currency}
        canCancel={false}
        canCollect={canCollect}
        onClose={() => setViewingId(null)}
        onChanged={() => router.refresh()}
      />

      <PaymentModal sale={paying} currency={currency} onClose={() => setPaying(null)} onSaved={() => router.refresh()} />
    </div>
  );
}
