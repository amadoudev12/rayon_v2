import { useState } from "react";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { loadPage, apiFetch } from "@/lib/api";
import { useRouter, useSearchParamsRecord } from "@/lib/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TableContainer, Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { useToast } from "@/components/ui/ToastProvider";
import { documentNumber, formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { QuoteDetailsModal } from "./QuoteDetailsModal";

type Quote = {
  id: number;
  total: number;
  nomClient: string | null;
  valableJusquAu: string | null;
  creeLe: string;
  client: { id: number; nom: string } | null;
  creePar: { prenom: string; nom: string };
  _count: { lignes: number };
};

type QuotesPageData = {
  quotes: Quote[];
  canCreate: boolean;
  canDelete: boolean;
  currency: string;
  page: number;
  totalPages: number;
  total: number;
};

export function loader({ request }: LoaderFunctionArgs) {
  return loadPage<QuotesPageData>("/devis", request);
}

export default function QuotesPage() {
  const params = useSearchParamsRecord();
  const router = useRouter();
  const { push } = useToast();
  const { quotes, canCreate, canDelete, currency, page, totalPages, total } = useLoaderData<QuotesPageData>();
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<Quote | null>(null);

  async function handleDelete() {
    if (!deleting) return;
    const response = await apiFetch(`/api/quotes/${deleting.id}`, { method: "DELETE" });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      push(body?.message ?? "Suppression impossible", "error");
      return;
    }
    push("Devis supprimé", "success");
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="Devis"
        description="Propositions de prix remises aux clients. Un devis ne modifie ni le stock ni le chiffre d'affaires."
        action={
          canCreate && (
            <LinkButton href="/devis/nouveau">
              <Icon name="plus" className="h-4 w-4" />
              Nouveau devis
            </LinkButton>
          )
        }
      />

      <Card>
        <div className="border-b border-slate-100 p-4">
          <SearchInput placeholder="Rechercher par client…" />
        </div>

        {quotes.length === 0 ? (
          <EmptyState icon="file" title="Aucun devis" description="Les devis que vous établissez apparaîtront ici." />
        ) : (
          <TableContainer>
            <Table>
              <Thead>
                <tr>
                  <Th>Devis</Th>
                  <Th>Client</Th>
                  <Th className="text-right">Articles</Th>
                  <Th className="text-right">Total</Th>
                  <Th>Validité</Th>
                  <Th>Date</Th>
                  {canDelete && <Th className="text-right">Actions</Th>}
                </tr>
              </Thead>
              <tbody>
                {quotes.map((quote) => (
                  <Tr key={quote.id} onClick={() => setViewingId(quote.id)}>
                    <Td className="tabular whitespace-nowrap font-medium text-slate-900">{documentNumber("DEV", quote.id)}</Td>
                    <Td>{quote.client?.nom ?? quote.nomClient ?? "—"}</Td>
                    <Td className="tabular text-right">{quote._count.lignes}</Td>
                    <Td className="tabular text-right font-medium text-slate-900">{formatMoney(quote.total, currency)}</Td>
                    <Td className="whitespace-nowrap text-slate-500">{quote.valableJusquAu ? formatDate(quote.valableJusquAu) : "—"}</Td>
                    <Td className="whitespace-nowrap text-slate-500">{formatDateTime(quote.creeLe)}</Td>
                    {canDelete && (
                      <Td className="text-right">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeleting(quote);
                          }}
                          className="rounded-md px-2 py-1 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-50"
                        >
                          Supprimer
                        </button>
                      </Td>
                    )}
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        )}

        <Pagination basePath="/devis" searchParams={params} page={page} totalPages={totalPages} total={total} />
      </Card>

      <QuoteDetailsModal quoteId={viewingId} currency={currency} onClose={() => setViewingId(null)} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Supprimer ce devis ?"
        description="Le devis sera définitivement supprimé. Aucune vente ni aucun stock n'est concerné."
        confirmLabel="Supprimer le devis"
        danger
      />
    </div>
  );
}
