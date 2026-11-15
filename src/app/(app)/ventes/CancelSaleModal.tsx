import { useState } from "react";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { FormField, inputClass, selectClass } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/ToastProvider";
import { documentNumber, formatMoney } from "@/lib/format";
import { TENDER_OPTIONS, type Tender } from "@/lib/labels";
import { sendJson, useIdempotencyKey } from "@/lib/mutation";

export type CancelTarget = {
  id: number;
  /** Argent reçu (paiements non annulés), net des remboursements déjà dus. */
  refundable: number;
};

/**
 * Annulation d'une vente. Deux cas distincts, choisis explicitement :
 * - l'argent reçu doit être rendu : un remboursement est enregistré (versé
 *   tout de suite avec son mode, ou plus tard) ;
 * - erreur de saisie du jour même : rien n'a été encaissé, le paiement saisi
 *   par erreur est annulé, sans faux remboursement.
 */
export function CancelSaleModal({
  sale,
  currency,
  onClose,
  onCancelled,
}: {
  sale: CancelTarget | null;
  currency: string;
  onClose: () => void;
  onCancelled: () => void;
}) {
  const { push } = useToast();
  const key = useIdempotencyKey();
  const [motif, setMotif] = useState("");
  const [type, setType] = useState<"REFUND" | "ENTRY_ERROR">("REFUND");
  const [refundNow, setRefundNow] = useState(true);
  const [tender, setTender] = useState<Tender>("CASH");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!sale) return null;
  const hasMoney = sale.refundable > 0;
  const motifError = motif.trim().length > 0 && motif.trim().length < 3 ? "Le motif doit contenir au moins 3 caractères." : null;

  function close() {
    key.reset();
    setMotif("");
    setType("REFUND");
    setError(null);
    onClose();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!sale || motif.trim().length < 3) return;
    setSubmitting(true);
    setError(null);
    const result = await sendJson(
      `/api/sales/${sale.id}/cancel`,
      {
        motif: motif.trim(),
        type,
        ...(type === "REFUND" && hasMoney && refundNow ? { remboursementImmediat: { modePaiement: tender } } : {}),
      },
      { idempotencyKey: key.get() },
    );
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    push(
      type === "ENTRY_ERROR"
        ? "Vente annulée : paiement saisi par erreur annulé, stock rétabli"
        : hasMoney && !refundNow
          ? "Vente annulée : remboursement à verser au client"
          : "Vente annulée, stock rétabli",
      "success",
    );
    key.reset();
    setMotif("");
    onCancelled();
    onClose();
  }

  return (
    <Modal open onClose={close} title={`Annuler la vente ${documentNumber("VTE", sale.id)}`} description="Les articles encore chez le client reviennent en stock." size="sm">
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}

        <FormField label="Motif de l'annulation" htmlFor="cancelMotif" error={motifError ?? undefined}>
          <textarea id="cancelMotif" rows={2} value={motif} onChange={(event) => setMotif(event.target.value)} className={inputClass} placeholder="Ex : client a changé d'avis" autoFocus />
        </FormField>

        {hasMoney && (
          <fieldset className="space-y-2">
            <legend className="mb-1.5 text-[13px] font-medium text-slate-700">Argent reçu : {formatMoney(sale.refundable, currency)}</legend>
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50/40">
              <input type="radio" name="cancelType" className="mt-0.5" checked={type === "REFUND"} onChange={() => setType("REFUND")} />
              <span>
                <span className="font-medium text-slate-900">Le client doit être remboursé</span>
                <span className="block text-xs text-slate-500">Les paiements restent dans l'historique ; le remboursement est enregistré à part.</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50/40">
              <input type="radio" name="cancelType" className="mt-0.5" checked={type === "ENTRY_ERROR"} onChange={() => setType("ENTRY_ERROR")} />
              <span>
                <span className="font-medium text-slate-900">Erreur de saisie : aucun argent reçu</span>
                <span className="block text-xs text-slate-500">Uniquement le jour même. Le paiement saisi par erreur est annulé et conservé dans l'historique.</span>
              </span>
            </label>
          </fieldset>
        )}

        {hasMoney && type === "REFUND" && (
          <div className="space-y-3 rounded-lg bg-slate-50 p-3 ring-1 ring-inset ring-slate-200/70">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={refundNow} onChange={(event) => setRefundNow(event.target.checked)} />
              Je rends {formatMoney(sale.refundable, currency)} au client maintenant
            </label>
            {refundNow ? (
              <FormField label="Mode de remboursement" htmlFor="cancelTender">
                <select id="cancelTender" value={tender} onChange={(event) => setTender(event.target.value as Tender)} className={selectClass}>
                  {TENDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>
            ) : (
              <p className="text-xs text-amber-700">La vente restera « remboursement à verser » tant que l'argent n'aura pas été rendu.</p>
            )}
          </div>
        )}

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={close} disabled={submitting}>
            Retour
          </Button>
          <Button type="submit" variant="danger" loading={submitting} disabled={motif.trim().length < 3}>
            Annuler la vente
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
