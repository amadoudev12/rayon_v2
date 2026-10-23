import { useState } from "react";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormField, inputClass } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/ToastProvider";
import { documentNumber, formatMoney } from "@/lib/format";
import { apiFetch } from "@/lib/api";

export type PaymentTarget = {
  id: number;
  clientName: string;
  total: number;
  paid: number;
};

/**
 * Saisie d'un versement sur une créance. Le serveur refuse tout montant
 * supérieur au reste à payer ; le formulaire le signale avant l'envoi.
 */
export function PaymentModal({
  sale,
  currency,
  onClose,
  onSaved,
}: {
  sale: PaymentTarget | null;
  currency: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { push } = useToast();
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!sale) return null;

  const remaining = Math.max(0, sale.total - sale.paid);
  const value = Number(amount);
  const error =
    amount === "" ? null : !(value > 0) ? "Le montant doit être supérieur à 0." : value > remaining ? "Le montant dépasse le reste à payer." : null;
  const newRemaining = error || amount === "" ? remaining : remaining - value;

  function close() {
    setAmount("");
    onClose();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!sale || error || amount === "") return;
    setSubmitting(true);
    try {
      const response = await apiFetch(`/api/sales/${sale.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ montant: value }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        push(body?.message ?? "Impossible d'enregistrer le paiement", "error");
        return;
      }
      push(newRemaining <= 0 ? "Paiement enregistré : la créance est réglée" : "Paiement enregistré", "success");
      setAmount("");
      onSaved();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open onClose={close} title="Enregistrer un paiement" description={`${documentNumber("VTE", sale.id)} · ${sale.clientName}`} size="sm">
      <form onSubmit={submit} className="space-y-4">
        <dl className="tabular space-y-1.5 rounded-lg bg-slate-50 p-3 text-sm ring-1 ring-inset ring-slate-200/70">
          <div className="flex justify-between text-slate-500">
            <dt>Total de la vente</dt>
            <dd>{formatMoney(sale.total, currency)}</dd>
          </div>
          <div className="flex justify-between text-slate-500">
            <dt>Déjà payé</dt>
            <dd>{formatMoney(sale.paid, currency)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200/80 pt-1.5 font-semibold text-amber-700">
            <dt>Reste à payer</dt>
            <dd>{formatMoney(remaining, currency)}</dd>
          </div>
        </dl>

        <FormField label="Montant versé" htmlFor="paymentAmount" error={error ?? undefined}>
          <div className="flex gap-2">
            <input
              id="paymentAmount"
              type="number"
              min={0}
              max={remaining}
              step="any"
              inputMode="decimal"
              autoFocus
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className={`${inputClass} tabular flex-1`}
              placeholder="0"
            />
            <Button type="button" variant="secondary" onClick={() => setAmount(String(remaining))}>
              Tout solder
            </Button>
          </div>
        </FormField>

        {amount !== "" && !error && (
          <p className="text-sm text-slate-600">
            Après ce paiement :{" "}
            {newRemaining <= 0 ? (
              <span className="font-medium text-emerald-700">la vente sera réglée.</span>
            ) : (
              <span className="font-medium text-slate-900">reste {formatMoney(newRemaining, currency)}</span>
            )}
          </p>
        )}

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={close} disabled={submitting}>
            Annuler
          </Button>
          <Button type="submit" loading={submitting} disabled={amount === "" || Boolean(error)}>
            Valider le paiement
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
