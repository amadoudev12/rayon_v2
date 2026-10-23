import { useEffect, useState } from "react";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { DocumentActions } from "@/components/documents/DocumentActions";
import { documentNumber, formatDate, formatDateTime, formatMoney, formatNumber } from "@/lib/format";
import type { CommercialDocument } from "@/lib/commercial-document";
import { apiFetch } from "@/lib/api";

/** Devis renvoyé par GET /api/quotes/[id] (montants Decimal en chaînes). */
type QuoteDetails = {
  id: number;
  sousTotal: string | number;
  remise: string | number;
  total: string | number;
  nomClient: string | null;
  valableJusquAu: string | null;
  note: string | null;
  creeLe: string;
  lignes: {
    id: number;
    designation: string;
    quantite: number;
    prixUnitaire: string | number;
    sousTotal: string | number;
    produit: { id: number; unite: string } | null;
  }[];
  client: { id: number; nom: string; telephone: string | null; email: string | null; adresse: string | null } | null;
  creePar: { prenom: string; nom: string };
  boutique: { nom: string; adresse: string | null; telephone: string | null; organisation: { nom: string } };
};

function quoteDocument(quote: QuoteDetails, currency: string): CommercialDocument {
  return {
    title: "Devis",
    number: documentNumber("DEV", quote.id),
    date: quote.creeLe,
    shop: {
      name: quote.boutique.organisation.nom,
      storeName: quote.boutique.nom,
      address: quote.boutique.adresse,
      phone: quote.boutique.telephone,
    },
    party: {
      label: "Client",
      name: quote.client?.nom ?? quote.nomClient ?? "—",
      details: [quote.client?.adresse, quote.client?.telephone, quote.client?.email],
    },
    meta: [
      ...(quote.valableJusquAu ? [{ label: "Valable jusqu'au", value: formatDate(quote.valableJusquAu, { dateStyle: "long" }) }] : []),
      { label: "Établi par", value: `${quote.creePar.prenom} ${quote.creePar.nom}` },
    ],
    lines: quote.lignes.map((line) => ({
      designation: line.designation,
      quantity: `${formatNumber(line.quantite)}${line.produit ? ` ${line.produit.unite}` : ""}`,
      unitPrice: Number(line.prixUnitaire),
      total: Number(line.sousTotal),
    })),
    totals: [
      ...(Number(quote.remise) > 0
        ? [
            { label: "Sous-total", value: Number(quote.sousTotal) },
            { label: "Remise", value: -Number(quote.remise) },
          ]
        : []),
      { label: "Total", value: Number(quote.total), strong: true },
    ],
    note: quote.note,
    footer: "Ce devis n'est pas une facture. Prix susceptibles d'évoluer au-delà de la date de validité.",
    currency,
    fileName: `devis-${documentNumber("DEV", quote.id)}`,
  };
}

export function QuoteDetailsModal({
  quoteId,
  currency,
  title,
  extraActions,
  onClose,
}: {
  quoteId: number | null;
  currency: string;
  title?: string;
  extraActions?: React.ReactNode;
  onClose: () => void;
}) {
  const [result, setResult] = useState<{ id: number; quote?: QuoteDetails; error?: string } | null>(null);
  const current = result?.id === quoteId ? result : null;
  const quote = current?.quote ?? null;
  const error = current?.error ?? null;

  useEffect(() => {
    if (!quoteId) return;
    let cancelled = false;
    apiFetch(`/api/quotes/${quoteId}`)
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (cancelled) return;
        if (!response.ok) setResult({ id: quoteId, error: body?.message ?? "Impossible de charger le devis" });
        else setResult({ id: quoteId, quote: body.data });
      })
      .catch(() => !cancelled && setResult({ id: quoteId, error: "Impossible de charger le devis" }));
    return () => {
      cancelled = true;
    };
  }, [quoteId]);

  if (!quoteId) return null;

  const number = documentNumber("DEV", quoteId);
  const expired = quote?.valableJusquAu ? new Date(quote.valableJusquAu) < new Date(new Date().toDateString()) : false;
  const clientName = quote?.client?.nom ?? quote?.nomClient ?? "Client non précisé";

  return (
    <Modal open onClose={onClose} title={title ?? `Devis ${number}`} description={quote ? formatDateTime(quote.creeLe) : undefined} size="lg">
      {error && <Alert>{error}</Alert>}
      {!quote && !error && (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-9" />
          <Skeleton className="h-32" />
        </div>
      )}

      {quote && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">Devis</Badge>
            {title && <span className="text-xs text-slate-500">{number}</span>}
            {quote.valableJusquAu && (
              <Badge dot tone={expired ? "danger" : "neutral"}>
                {expired ? "Expiré le" : "Valable jusqu'au"} {formatDate(quote.valableJusquAu)}
              </Badge>
            )}
            <span className="text-xs text-slate-500">Aucun stock réservé, aucune vente enregistrée.</span>
          </div>

          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs font-medium text-slate-500">Client</dt>
              <dd className="mt-0.5 text-sm text-slate-900">
                {clientName}
                {quote.client?.telephone && <span className="block text-xs text-slate-500">{quote.client.telephone}</span>}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Établi par</dt>
              <dd className="mt-0.5 text-sm text-slate-900">
                {quote.creePar.prenom} {quote.creePar.nom}
              </dd>
            </div>
          </dl>

          <div className="scrollbar-thin overflow-x-auto rounded-lg border border-slate-200/80">
            <table className="w-full min-w-md text-left text-sm">
              <thead className="border-b border-slate-200/80 bg-slate-50/70 text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Désignation</th>
                  <th className="px-3 py-2 text-right font-medium">Qté</th>
                  <th className="px-3 py-2 text-right font-medium">Prix unitaire</th>
                  <th className="px-3 py-2 text-right font-medium">Sous-total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quote.lignes.map((line) => (
                  <tr key={line.id}>
                    <td className="px-3 py-2 text-slate-900">{line.designation}</td>
                    <td className="px-3 py-2 text-right text-slate-700">
                      {formatNumber(line.quantite)} {line.produit?.unite}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-700">{formatMoney(Number(line.prixUnitaire), currency)}</td>
                    <td className="px-3 py-2 text-right font-medium text-slate-900">{formatMoney(Number(line.sousTotal), currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="tabular ml-auto w-full space-y-1.5 rounded-lg bg-slate-50 p-3 text-sm ring-1 ring-inset ring-slate-200/70 sm:max-w-xs">
            <div className="flex justify-between text-slate-500">
              <dt>Sous-total</dt>
              <dd>{formatMoney(Number(quote.sousTotal), currency)}</dd>
            </div>
            <div className="flex justify-between text-slate-500">
              <dt>Remise</dt>
              <dd>-{formatMoney(Number(quote.remise), currency)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-1 text-base font-semibold text-slate-900">
              <dt>Total</dt>
              <dd>{formatMoney(Number(quote.total), currency)}</dd>
            </div>
          </dl>

          {quote.note && (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <span className="font-medium text-slate-700">Note : </span>
              {quote.note}
            </p>
          )}

          <ModalFooter className="sm:flex-wrap">
            <DocumentActions
              document={quoteDocument(quote, currency)}
              printLabel="Imprimer le devis"
              phone={quote.client?.telephone}
              shareMessage={`Bonjour ${clientName}, voici notre devis ${number} d'un montant de ${formatMoney(Number(quote.total), currency)}${quote.valableJusquAu ? `, valable jusqu'au ${formatDate(quote.valableJusquAu)}` : ""}.`}
            />
            {extraActions}
          </ModalFooter>
        </div>
      )}
    </Modal>
  );
}
