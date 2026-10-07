import { useEffect, useState } from "react";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/format";
import { apiFetch } from "@/lib/api";

/**
 * Achat détaillé renvoyé par GET /api/purchases/[id]. Les montants Decimal
 * arrivent en chaînes dans le JSON, d'où le `string | number`.
 */
type PurchaseDetails = {
  id: number;
  total: string | number;
  note: string | null;
  creeLe: string;
  lignes: {
    id: number;
    quantite: number;
    coutUnitaire: string | number;
    sousTotal: string | number;
    produit: { id: number; nom: string; unite: string };
  }[];
  fournisseur: { id: number; nom: string; telephone: string | null } | null;
  creePar: { id: number; prenom: string; nom: string };
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

export function PurchaseDetailsModal({
  purchaseId,
  currency,
  onClose,
}: {
  purchaseId: number | null;
  currency: string;
  onClose: () => void;
}) {
  // Le résultat est rattaché à l'id chargé : à l'ouverture d'un autre achat,
  // l'ancien résultat est ignoré sans avoir à réinitialiser l'état.
  const [result, setResult] = useState<{ id: number; purchase?: PurchaseDetails; error?: string } | null>(null);
  const current = result?.id === purchaseId ? result : null;
  const purchase = current?.purchase ?? null;
  const error = current?.error ?? null;

  useEffect(() => {
    if (!purchaseId) return;
    let cancelled = false;
    apiFetch(`/api/purchases/${purchaseId}`)
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (cancelled) return;
        if (!response.ok) setResult({ id: purchaseId, error: body?.message ?? "Impossible de charger l'achat" });
        else setResult({ id: purchaseId, purchase: body.data });
      })
      .catch(() => !cancelled && setResult({ id: purchaseId, error: "Impossible de charger l'achat" }));
    return () => {
      cancelled = true;
    };
  }, [purchaseId]);

  if (!purchaseId) return null;

  const title = `Achat #${String(purchaseId).padStart(5, "0")}`;
  const articles = purchase ? purchase.lignes.reduce((total, line) => total + line.quantite, 0) : 0;

  return (
    <Modal open onClose={onClose} title={title} description={purchase ? formatDateTime(purchase.creeLe) : undefined} size="lg">
      {error && <Alert>{error}</Alert>}
      {!purchase && !error && (
        <div className="space-y-4" aria-busy="true">
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
          </div>
          <Skeleton className="h-32" />
        </div>
      )}

      {purchase && (
        <div className="space-y-5">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Fournisseur">
              {purchase.fournisseur ? purchase.fournisseur.nom : "Aucun"}
              {purchase.fournisseur?.telephone && (
                <span className="block text-xs text-slate-500">{purchase.fournisseur.telephone}</span>
              )}
            </Field>
            <Field label="Enregistré par">
              {purchase.creePar.prenom} {purchase.creePar.nom}
            </Field>
            <Field label="Boutique">{purchase.boutique.nom}</Field>
          </dl>

          <div className="scrollbar-thin overflow-x-auto rounded-lg border border-slate-200/80">
            <table className="w-full min-w-md text-left text-sm">
              <thead className="border-b border-slate-200/80 bg-slate-50/70 text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Produit</th>
                  <th className="px-3 py-2 text-right font-medium">Qté reçue</th>
                  <th className="px-3 py-2 text-right font-medium">Coût unitaire</th>
                  <th className="px-3 py-2 text-right font-medium">Sous-total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchase.lignes.map((line) => (
                  <tr key={line.id}>
                    <td className="px-3 py-2 text-slate-900">{line.produit.nom}</td>
                    <td className="px-3 py-2 text-right text-slate-700">
                      {formatNumber(line.quantite)} {line.produit.unite}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-700">{formatMoney(Number(line.coutUnitaire), currency)}</td>
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
              <dt>Articles reçus</dt>
              <dd>{formatNumber(articles)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-1 text-base font-semibold text-slate-900">
              <dt>Total</dt>
              <dd>{formatMoney(Number(purchase.total), currency)}</dd>
            </div>
          </dl>

          {purchase.note && (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <span className="font-medium text-slate-700">Note : </span>
              {purchase.note}
            </p>
          )}

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Fermer
            </Button>
          </ModalFooter>
        </div>
      )}
    </Modal>
  );
}
