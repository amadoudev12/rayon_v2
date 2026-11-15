import { useState } from "react";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { FormField, inputClass, selectClass } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/ToastProvider";
import { formatMoney } from "@/lib/format";
import { TENDER_OPTIONS, type Tender } from "@/lib/labels";
import { sendJson, useIdempotencyKey } from "@/lib/mutation";

export type PayoutTarget = { refundId: number; motif: string; remaining: number };

/**
 * Confirmation d'un remboursement réellement remis au client : montant (au
 * plus le solde dû) et mode choisi dans une liste contrôlée.
 */
export function RefundPayoutModal({
  target,
  currency,
  onClose,
  onSaved,
}: {
  target: PayoutTarget | null;
  currency: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { push } = useToast();
  const key = useIdempotencyKey();
  const [amount, setAmount] = useState("");
  const [tender, setTender] = useState<Tender>("CASH");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!target) return null;
  const value = amount === "" ? target.remaining : Number(amount);
  const amountError = !(value > 0) ? "Le montant doit être supérieur à 0." : value > target.remaining ? "Le montant dépasse le solde à rembourser." : null;

  function close() {
    key.reset();
    setAmount("");
    setError(null);
    onClose();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!target || amountError) return;
    setSubmitting(true);
    setError(null);
    const result = await sendJson(`/api/sales/refunds/${target.refundId}/payouts`, { montant: value, modePaiement: tender }, { idempotencyKey: key.get() });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    push(value >= target.remaining ? "Remboursement soldé" : "Versement enregistré", "success");
    key.reset();
    setAmount("");
    onSaved();
    onClose();
  }

  return (
    <Modal open onClose={close} title="Confirmer un remboursement versé" description={target.motif} size="sm">
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600 ring-1 ring-inset ring-slate-200/70">
          Reste à rendre au client : <span className="font-semibold text-slate-900">{formatMoney(target.remaining, currency)}</span>
        </p>
        <FormField label="Montant effectivement rendu" htmlFor="payoutAmount" error={amount !== "" ? (amountError ?? undefined) : undefined}>
          <input
            id="payoutAmount"
            type="number"
            min={0}
            max={target.remaining}
            step="any"
            inputMode="decimal"
            value={amount}
            placeholder={String(target.remaining)}
            onChange={(event) => setAmount(event.target.value)}
            className={`${inputClass} tabular`}
            autoFocus
          />
        </FormField>
        <FormField label="Mode de remboursement" htmlFor="payoutTender">
          <select id="payoutTender" value={tender} onChange={(event) => setTender(event.target.value as Tender)} className={selectClass}>
            {TENDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={close} disabled={submitting}>
            Annuler
          </Button>
          <Button type="submit" loading={submitting} disabled={Boolean(amountError)}>
            Confirmer le versement
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
