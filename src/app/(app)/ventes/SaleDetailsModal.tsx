import { useEffect, useState } from "react";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Alert } from "@/components/ui/Alert";
import { DocumentActions } from "@/components/documents/DocumentActions";
import { documentNumber, formatDate, formatDateTime, formatMoney, formatNumber } from "@/lib/format";
import { CANCELLATION_LABELS, PAYMENT_METHOD_LABELS, SETTLEMENT_LABELS } from "@/lib/labels";
import type { CommercialDocument } from "@/lib/commercial-document";
import type { PaymentMethod } from "@/generated/prisma/enums";
import { apiFetch } from "@/lib/api";
import { PaymentModal } from "../creances/PaymentModal";
import { CancelSaleModal } from "./CancelSaleModal";
import { RefundPayoutModal, type PayoutTarget } from "./RefundPayoutModal";
import { ReturnModal } from "./ReturnModal";

type Money = string | number;
type Person = { prenom: string; nom: string } | null;

/** Vente détaillée renvoyée par GET /api/sales/:id (montants Decimal en chaînes). */
type SaleDetails = {
  id: number;
  statut: "COMPLETED" | "CANCELLED";
  modePaiement: PaymentMethod;
  sousTotal: Money;
  remise: Money;
  total: Money;
  montantPaye: Money;
  montantRetourne: Money;
  montantARembourser: Money;
  resteAPayer: Money;
  remboursementEnAttente: Money;
  etatFinancier: "SOLDEE" | "CREANCE" | "REMBOURSEMENT_EN_ATTENTE";
  typeAnnulation: "REFUND" | "ENTRY_ERROR" | "LEGACY" | null;
  motifAnnulation: string | null;
  note: string | null;
  creeLe: string;
  annuleLe: string | null;
  annulePar: Person;
  lignes: {
    id: number;
    quantite: number;
    quantiteRetournee: number;
    quantiteRestante: number;
    prixUnitaire: Money;
    /** Coût figé au moment de la vente : absent pour les rôles sans accès aux rapports. */
    coutUnitaire?: Money;
    sousTotal: Money;
    produit: { id: number; nom: string; unite: string };
  }[];
  paiements: { id: number; montant: Money; date: string; modePaiement: PaymentMethod | null; annule: boolean; motifAnnulation: string | null; utilisateur: Person }[];
  remboursements: {
    id: number;
    montant: Money;
    montantVerse: Money;
    montantRestant: Money;
    statut: string;
    motif: string;
    creeLe: string;
    versements: { id: number; montant: Money; modePaiement: PaymentMethod; date: string; utilisateur: Person }[];
  }[];
  retours: {
    id: number;
    montant: Money;
    motif: string;
    creeLe: string;
    creePar: Person;
    lignes: { id: number; quantite: number; montant: Money; remiseEnStock: boolean; produit: { nom: string; unite: string } }[];
  }[];
  client: { id: number; nom: string; telephone: string | null } | null;
  vendeur: { id: number; prenom: string; nom: string };
  boutique: { id: number; nom: string; adresse: string | null; telephone: string | null; organisation: { nom: string } };
};

const person = (value: Person) => (value ? `${value.prenom} ${value.nom}` : "—");

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{children}</dd>
    </div>
  );
}

/** Reçu de vente : montants payés, retours et reste à payer. */
function saleReceipt(sale: SaleDetails, currency: string): CommercialDocument {
  const isCredit = sale.modePaiement === "CREDIT";
  const remaining = Number(sale.resteAPayer);
  const returned = Number(sale.montantRetourne);
  return {
    title: "Reçu de vente",
    number: documentNumber("VTE", sale.id),
    date: sale.creeLe,
    withTime: true,
    shop: { name: sale.boutique.organisation.nom, storeName: sale.boutique.nom, address: sale.boutique.adresse, phone: sale.boutique.telephone },
    party: { label: "Client", name: sale.client?.nom ?? "Client de passage", details: [sale.client?.telephone] },
    meta: [
      { label: "Paiement", value: PAYMENT_METHOD_LABELS[sale.modePaiement] },
      { label: "Vendeur", value: `${sale.vendeur.prenom} ${sale.vendeur.nom}` },
      ...(sale.statut === "CANCELLED" ? [{ label: "Statut", value: "Vente annulée" }] : []),
    ],
    badge: sale.statut === "CANCELLED" ? "Annulée" : isCredit ? "Vente à crédit" : undefined,
    lines: sale.lignes.map((line) => ({
      designation: line.produit.nom,
      quantity: `${formatNumber(line.quantite)} ${line.produit.unite}`,
      unitPrice: Number(line.prixUnitaire),
      total: Number(line.sousTotal),
    })),
    totals: [
      ...(Number(sale.remise) > 0 ? [{ label: "Sous-total", value: Number(sale.sousTotal) }, { label: "Remise", value: -Number(sale.remise) }] : []),
      { label: "Total", value: Number(sale.total), strong: true },
      ...(returned > 0 ? [{ label: "Retours (avoir)", value: -returned }] : []),
      { label: "Montant payé", value: Number(sale.montantPaye) },
      ...(isCredit || remaining > 0 ? [{ label: "Reste à payer", value: remaining, strong: remaining > 0 }] : []),
    ],
    history:
      isCredit && sale.paiements.length > 0
        ? { title: "Versements reçus", rows: sale.paiements.filter((payment) => !payment.annule).map((payment) => ({ label: formatDate(payment.date), value: Number(payment.montant) })) }
        : undefined,
    note: sale.note,
    footer: "Merci de votre confiance.",
    currency,
    fileName: `recu-${documentNumber("VTE", sale.id)}`,
  };
}

export function SaleDetailsModal({
  saleId,
  currency,
  canCancel,
  canCollect = false,
  canViewFinance = false,
  canReturn = false,
  canRefund = false,
  title,
  extraActions,
  onClose,
  onChanged,
}: {
  saleId: number | null;
  currency: string;
  /** Peut annuler la vente (permission `sale:cancel`). */
  canCancel: boolean;
  /** Peut enregistrer un paiement sur une créance. */
  canCollect?: boolean;
  /** Affiche coûts historiques et marges. */
  canViewFinance?: boolean;
  /** Peut enregistrer un retour d'articles (`return:manage`). */
  canReturn?: boolean;
  /** Peut confirmer un remboursement versé (`refund:manage`). */
  canRefund?: boolean;
  /** Titre à la place de « Vente VTE-… » (ex : juste après l'encaissement). */
  title?: string;
  extraActions?: React.ReactNode;
  onClose: () => void;
  /** Après une modification : la page appelante recharge ses chiffres. */
  onChanged?: () => void;
}) {
  // Le résultat est rattaché à l'id chargé : à l'ouverture d'une autre vente,
  // l'ancien résultat est ignoré sans avoir à réinitialiser l'état.
  const [result, setResult] = useState<{ id: number; sale?: SaleDetails; error?: string } | null>(null);
  const [version, setVersion] = useState(0);
  const [dialog, setDialog] = useState<"pay" | "cancel" | "return" | null>(null);
  const [payout, setPayout] = useState<PayoutTarget | null>(null);
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
  }, [saleId, version]);

  if (!saleId) return null;

  function refresh() {
    setVersion((value) => value + 1);
    onChanged?.();
  }

  const number = documentNumber("VTE", saleId);
  const isCancelled = sale?.statut === "CANCELLED";
  const resteAPayer = sale ? Number(sale.resteAPayer) : 0;
  const returned = sale ? Number(sale.montantRetourne) : 0;
  const settlement = sale ? SETTLEMENT_LABELS[sale.etatFinancier] : null;
  const canBeReturned = sale ? !isCancelled && sale.lignes.some((line) => line.quantiteRestante > 0) : false;
  // Marge nette des retours : CA conservé − coût figé des articles conservés.
  const margin =
    sale && canViewFinance
      ? Number(sale.total) - returned - sale.lignes.reduce((sum, line) => sum + Number(line.coutUnitaire ?? 0) * line.quantiteRestante, 0)
      : 0;
  const refundable = sale ? Math.max(0, Number(sale.montantPaye) - Number(sale.montantARembourser)) : 0;

  return (
    <>
      <Modal open={dialog === null && payout === null} onClose={onClose} title={title ?? `Vente ${number}`} description={sale ? formatDateTime(sale.creeLe) : undefined} size="lg">
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
              <Badge dot tone={isCancelled ? "danger" : "success"}>{isCancelled ? (CANCELLATION_LABELS[sale.typeAnnulation ?? "REFUND"] ?? "Annulée") : "Terminée"}</Badge>
              <Badge tone="brand">{PAYMENT_METHOD_LABELS[sale.modePaiement]}</Badge>
              {settlement && <Badge dot tone={settlement.tone}>{settlement.label}</Badge>}
              {title && <span className="text-xs text-slate-500">{number}</span>}
            </div>

            {isCancelled && (
              <p className="rounded-lg bg-red-50/60 px-3 py-2 text-sm text-red-800 ring-1 ring-inset ring-red-200/70">
                Annulée le {sale.annuleLe ? formatDateTime(sale.annuleLe) : "—"} par {person(sale.annulePar)}
                {sale.motifAnnulation && <span className="block text-xs">Motif : {sale.motifAnnulation}</span>}
              </p>
            )}

            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Client">
                {sale.client ? sale.client.nom : "Client de passage"}
                {sale.client?.telephone && <span className="block text-xs text-slate-500">{sale.client.telephone}</span>}
              </Field>
              <Field label="Vendeur">{person(sale.vendeur)}</Field>
              <Field label="Boutique">{sale.boutique.nom}</Field>
            </dl>

            <div className="scrollbar-thin overflow-x-auto rounded-lg border border-slate-200/80">
              <table className="w-full min-w-md text-left text-sm">
                <thead className="border-b border-slate-200/80 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Produit</th>
                    <th className="px-3 py-2 text-right font-medium">Qté</th>
                    <th className="px-3 py-2 text-right font-medium">Prix unitaire</th>
                    {canViewFinance && <th className="px-3 py-2 text-right font-medium">Coût unitaire</th>}
                    <th className="px-3 py-2 text-right font-medium">Sous-total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sale.lignes.map((line) => (
                    <tr key={line.id}>
                      <td className="px-3 py-2 text-slate-900">{line.produit.nom}</td>
                      <td className="tabular px-3 py-2 text-right text-slate-700">
                        {formatNumber(line.quantite)} {line.produit.unite}
                        {line.quantiteRetournee > 0 && <span className="block text-xs text-amber-700">dont {formatNumber(line.quantiteRetournee)} retourné(s)</span>}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">{formatMoney(Number(line.prixUnitaire), currency)}</td>
                      {canViewFinance && <td className="px-3 py-2 text-right text-slate-500">{formatMoney(Number(line.coutUnitaire ?? 0), currency)}</td>}
                      <td className="px-3 py-2 text-right font-medium text-slate-900">{formatMoney(Number(line.sousTotal), currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1 space-y-4">
                {sale.paiements.length > 0 && (
                  <section>
                    <p className="mb-1.5 text-xs font-medium text-slate-500">Paiements reçus</p>
                    <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200/80 text-sm">
                      {sale.paiements.map((payment) => (
                        <li key={payment.id} className="flex items-center justify-between gap-3 px-3 py-2">
                          <span className="text-slate-600">
                            {formatDateTime(payment.date)} · {payment.modePaiement ? PAYMENT_METHOD_LABELS[payment.modePaiement] : "Mode non renseigné"}
                            <span className="block text-xs text-slate-400">par {person(payment.utilisateur)}</span>
                            {payment.annule && <span className="block text-xs font-medium text-red-600">Annulé : {payment.motifAnnulation}</span>}
                          </span>
                          <span className={`tabular font-medium ${payment.annule ? "text-slate-400 line-through" : "text-slate-900"}`}>
                            {formatMoney(Number(payment.montant), currency)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {sale.retours.length > 0 && (
                  <section>
                    <p className="mb-1.5 text-xs font-medium text-slate-500">Retours d'articles</p>
                    <ul className="space-y-2">
                      {sale.retours.map((retour) => (
                        <li key={retour.id} className="rounded-lg border border-slate-200/80 p-3 text-sm">
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-700">{retour.motif}</span>
                            <span className="tabular font-medium text-slate-900">−{formatMoney(Number(retour.montant), currency)}</span>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {formatDateTime(retour.creeLe)} · {person(retour.creePar)}
                          </p>
                          {retour.lignes.map((line) => (
                            <p key={line.id} className="text-xs text-slate-500">
                              {formatNumber(line.quantite)} × {line.produit.nom} — {line.remiseEnStock ? "remis en stock" : "non revendable (perte)"}
                            </p>
                          ))}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {sale.remboursements.length > 0 && (
                  <section>
                    <p className="mb-1.5 text-xs font-medium text-slate-500">Remboursements dus au client</p>
                    <ul className="space-y-2">
                      {sale.remboursements.map((refund) => {
                        const remaining = Number(refund.montantRestant);
                        return (
                          <li key={refund.id} className="rounded-lg border border-slate-200/80 p-3 text-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-slate-700">{refund.motif}</span>
                              <Badge dot tone={remaining > 0 ? "warning" : "success"}>{remaining > 0 ? `${formatMoney(remaining, currency)} à rendre` : "Remboursé"}</Badge>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              Dû {formatMoney(Number(refund.montant), currency)} · rendu {formatMoney(Number(refund.montantVerse), currency)}
                            </p>
                            {refund.versements.map((versement) => (
                              <p key={versement.id} className="text-xs text-slate-500">
                                {formatDateTime(versement.date)} · {PAYMENT_METHOD_LABELS[versement.modePaiement]} · {formatMoney(Number(versement.montant), currency)} · {person(versement.utilisateur)}
                              </p>
                            ))}
                            {remaining > 0 && canRefund && (
                              <Button type="button" size="sm" className="mt-2" onClick={() => setPayout({ refundId: refund.id, motif: refund.motif, remaining })}>
                                Confirmer un versement
                              </Button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                )}
              </div>

              <dl className="tabular w-full space-y-1.5 rounded-lg bg-slate-50 p-3 text-sm ring-1 ring-inset ring-slate-200/70 sm:max-w-xs">
                <div className="flex justify-between text-slate-500">
                  <dt>Sous-total</dt>
                  <dd>{formatMoney(Number(sale.sousTotal), currency)}</dd>
                </div>
                <div className="flex justify-between text-slate-500">
                  <dt>Remise</dt>
                  <dd>−{formatMoney(Number(sale.remise), currency)}</dd>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-1 text-base font-semibold text-slate-900">
                  <dt>Total</dt>
                  <dd className={isCancelled ? "text-slate-400 line-through" : ""}>{formatMoney(Number(sale.total), currency)}</dd>
                </div>
                {returned > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <dt>Retours (avoir)</dt>
                    <dd>−{formatMoney(returned, currency)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <dt>Payé</dt>
                  <dd>{formatMoney(Number(sale.montantPaye), currency)}</dd>
                </div>
                {resteAPayer > 0 && (
                  <div className="flex justify-between font-medium text-amber-600">
                    <dt>Reste à payer</dt>
                    <dd>{formatMoney(resteAPayer, currency)}</dd>
                  </div>
                )}
                {Number(sale.remboursementEnAttente) > 0 && (
                  <div className="flex justify-between font-medium text-red-600">
                    <dt>À rendre au client</dt>
                    <dd>{formatMoney(Number(sale.remboursementEnAttente), currency)}</dd>
                  </div>
                )}
                {canViewFinance && !isCancelled && (
                  <div className="flex justify-between border-t border-slate-100 pt-1 text-slate-500">
                    <dt>Marge brute</dt>
                    <dd className={margin < 0 ? "text-red-600" : "text-slate-700"}>{formatMoney(margin, currency)}</dd>
                  </div>
                )}
              </dl>
            </div>

            {sale.note && (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                <span className="font-medium text-slate-700">Note : </span>
                {sale.note}
              </p>
            )}

            <ModalFooter className="sm:flex-wrap">
              {canCancel && !isCancelled && (
                <Button type="button" variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700 sm:mr-auto" onClick={() => setDialog("cancel")}>
                  Annuler la vente
                </Button>
              )}
              {canReturn && canBeReturned && (
                <Button type="button" variant="secondary" onClick={() => setDialog("return")}>
                  Retour d'articles
                </Button>
              )}
              <DocumentActions
                document={saleReceipt(sale, currency)}
                printLabel="Imprimer le reçu"
                downloadLabel="Reçu PDF"
                phone={sale.client?.telephone}
                shareMessage={`Bonjour ${sale.client?.nom ?? ""}, voici votre reçu ${number} : total ${formatMoney(Number(sale.total), currency)}, payé ${formatMoney(Number(sale.montantPaye), currency)}${resteAPayer > 0 ? `, reste à payer ${formatMoney(resteAPayer, currency)}` : ""}. Merci !`}
              />
              {canCollect && !isCancelled && resteAPayer > 0 && (
                <Button type="button" onClick={() => setDialog("pay")}>
                  <Icon name="coins" className="h-4 w-4" />
                  Enregistrer un paiement
                </Button>
              )}
              {extraActions}
            </ModalFooter>
          </div>
        )}
      </Modal>

      {dialog === "pay" && sale && (
        <PaymentModal
          sale={{ id: sale.id, clientName: sale.client?.nom ?? "Client", total: Number(sale.total) - returned, paid: Number(sale.montantPaye) - Number(sale.montantARembourser), remaining: resteAPayer }}
          currency={currency}
          onClose={() => setDialog(null)}
          onSaved={refresh}
        />
      )}
      {dialog === "cancel" && sale && (
        <CancelSaleModal sale={{ id: sale.id, refundable }} currency={currency} onClose={() => setDialog(null)} onCancelled={refresh} />
      )}
      {dialog === "return" && sale && (
        <ReturnModal
          sale={{
            id: sale.id,
            sousTotal: Number(sale.sousTotal),
            total: Number(sale.total),
            resteAPayer,
            lignes: sale.lignes.map((line) => ({ ...line, prixUnitaire: Number(line.prixUnitaire) })),
          }}
          currency={currency}
          onClose={() => setDialog(null)}
          onSaved={refresh}
        />
      )}
      <RefundPayoutModal target={payout} currency={currency} onClose={() => setPayout(null)} onSaved={refresh} />
    </>
  );
}
