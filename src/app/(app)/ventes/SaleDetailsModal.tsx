import { useEffect, useState } from "react";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/labels";
import type { PaymentMethod } from "@/generated/prisma/enums";
import { Alert } from "@/components/ui/Alert";
import { apiFetch } from "@/lib/api";

/**
 * Vente détaillée renvoyée par GET /api/sales/[id]. Les montants Decimal
 * arrivent en chaînes dans le JSON, d'où le `string | number`.
 */
type SaleDetails = {
  id: number;
  statut: "COMPLETED" | "CANCELLED";
  modePaiement: PaymentMethod;
  sousTotal: string | number;
  remise: string | number;
  total: string | number;
  montantPaye: string | number;
  note: string | null;
  creeLe: string;
  annuleLe: string | null;
  lignes: {
    id: number;
    quantite: number;
    prixUnitaire: string | number;
    sousTotal: string | number;
    produit: { id: number; nom: string; unite: string };
  }[];
  client: { id: number; nom: string; telephone: string | null } | null;
  vendeur: { id: number; prenom: string; nom: string };
  boutique: { id: number; nom: string };
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{children}</dd>
    </div>
  );
}

export function SaleDetailsModal({
  saleId,
  currency,
  canCancel,
  onClose,
  onCancel,
}: {
  saleId: number | null;
  currency: string;
  canCancel: boolean;
  onClose: () => void;
  /** Demande l'annulation (la confirmation est gérée par le tableau). */
  onCancel: () => void;
}) {
  // Le résultat est rattaché à l'id chargé : à l'ouverture d'une autre vente,
  // l'ancien résultat est ignoré sans avoir à réinitialiser l'état.
  const [result, setResult] = useState<{ id: number; sale?: SaleDetails; error?: string } | null>(null);
  const current = result?.id === saleId ? result : null;
  const sale = current?.sale ?? null;
  const error = current?.error ?? null;

  useEffect(() => {
    if (!saleId) return;
    let cancelled = false;
    apiFetch(`/api/sales/${saleId}`)
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (cancelled) return;
        if (!response.ok) setResult({ id: saleId, error: body?.message ?? "Impossible de charger la vente" });
        else setResult({ id: saleId, sale: body.data });
      })
      .catch(() => !cancelled && setResult({ id: saleId, error: "Impossible de charger la vente" }));
    return () => {
      cancelled = true;
    };
  }, [saleId]);

  if (!saleId) return null;

  const title = `Vente #${String(saleId).padStart(5, "0")}`;
  const isCancelled = sale?.statut === "CANCELLED";
  const resteAPayer = sale ? Number(sale.total) - Number(sale.montantPaye) : 0;

  return (
    <Modal open onClose={onClose} title={title} description={sale ? formatDateTime(sale.creeLe) : undefined} size="lg">
      {error && <Alert>{error}</Alert>}
      {!sale && !error && (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-5 w-40" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
          </div>
          <Skeleton className="h-32" />
        </div>
      )}

      {sale && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge dot tone={isCancelled ? "danger" : "success"}>{isCancelled ? "Annulée" : "Terminée"}</Badge>
            <Badge tone="brand">{PAYMENT_METHOD_LABELS[sale.modePaiement]}</Badge>
            {isCancelled && sale.annuleLe && (
              <span className="text-xs text-slate-500">Annulée le {formatDateTime(sale.annuleLe)}</span>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Client">
              {sale.client ? sale.client.nom : "Client de passage"}
              {sale.client?.telephone && <span className="block text-xs text-slate-500">{sale.client.telephone}</span>}
            </Field>
            <Field label="Vendeur">
              {sale.vendeur.prenom} {sale.vendeur.nom}
            </Field>
            <Field label="Boutique">{sale.boutique.nom}</Field>
          </dl>

          <div className="scrollbar-thin overflow-x-auto rounded-lg border border-slate-200/80">
            <table className="w-full min-w-md text-left text-sm">
              <thead className="border-b border-slate-200/80 bg-slate-50/70 text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Produit</th>
                  <th className="px-3 py-2 text-right font-medium">Qté</th>
                  <th className="px-3 py-2 text-right font-medium">Prix unitaire</th>
                  <th className="px-3 py-2 text-right font-medium">Sous-total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sale.lignes.map((line) => (
                  <tr key={line.id}>
                    <td className="px-3 py-2 text-slate-900">{line.produit.nom}</td>
                    <td className="px-3 py-2 text-right text-slate-700">
                      {formatNumber(line.quantite)} {line.produit.unite}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-700">{formatMoney(Number(line.prixUnitaire), currency)}</td>
                    <td className="px-3 py-2 text-right font-medium text-slate-900">
                      {formatMoney(Number(line.sousTotal), currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="tabular ml-auto w-full space-y-1.5 rounded-lg bg-slate-50 p-3 text-sm ring-1 ring-inset ring-slate-200/70 sm:max-w-xs">
            <div className="flex justify-between text-slate-500">
              <dt>Sous-total</dt>
              <dd>{formatMoney(Number(sale.sousTotal), currency)}</dd>
            </div>
            <div className="flex justify-between text-slate-500">
              <dt>Remise</dt>
              <dd>-{formatMoney(Number(sale.remise), currency)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-1 text-base font-semibold text-slate-900">
              <dt>Total</dt>
              <dd className={isCancelled ? "text-slate-400 line-through" : ""}>{formatMoney(Number(sale.total), currency)}</dd>
            </div>
            <div className="flex justify-between text-slate-500">
              <dt>Montant payé</dt>
              <dd>{formatMoney(Number(sale.montantPaye), currency)}</dd>
            </div>
            {resteAPayer > 0 && (
              <div className="flex justify-between font-medium text-amber-600">
                <dt>Reste à payer</dt>
                <dd>{formatMoney(resteAPayer, currency)}</dd>
              </div>
            )}
          </dl>

          {sale.note && (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <span className="font-medium text-slate-700">Note : </span>
              {sale.note}
            </p>
          )}

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Fermer
            </Button>
            {canCancel && !isCancelled && (
              <Button type="button" variant="danger" onClick={onCancel}>
                Annuler la vente
              </Button>
            )}
          </ModalFooter>
        </div>
      )}
    </Modal>
  );
}
