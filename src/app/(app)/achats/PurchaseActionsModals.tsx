import { useState } from "react";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { FormField, inputClass, selectClass } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/ToastProvider";
import { documentNumber, formatMoney } from "@/lib/format";
import { TENDER_OPTIONS, type Tender } from "@/lib/labels";
import { sendJson, useIdempotencyKey } from "@/lib/mutation";

/** Règlement (total ou partiel) d'une dette fournisseur, avec son mode. */
export function SupplierPaymentModal({
  purchase,
  currency,
  onClose,
  onSaved,
}: {
  purchase: { id: number; remaining: number } | null;
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
  if (!purchase) return null;

  const value = amount === "" ? purchase.remaining : Number(amount);
  const problem = !(value > 0) ? "Le montant doit être supérieur à 0." : value > purchase.remaining ? "Le montant dépasse le reste dû au fournisseur." : null;

  function close() {
    key.reset();
    setAmount("");
    setError(null);
    onClose();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!purchase || problem) return;
    setSubmitting(true);
    const result = await sendJson(`/api/purchases/${purchase.id}/payments`, { montant: value, modePaiement: tender }, { idempotencyKey: key.get() });
    setSubmitting(false);
    if (!result.ok) return setError(result.message);
    push(value >= purchase.remaining ? "Achat réglé" : "Paiement fournisseur enregistré", "success");
    key.reset();
    setAmount("");
    onSaved();
    onClose();
  }

  return (
    <Modal open onClose={close} title="Payer le fournisseur" description={`${documentNumber("ACH", purchase.id)} · reste dû ${formatMoney(purchase.remaining, currency)}`} size="sm">
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <FormField label="Montant versé" htmlFor="supplierAmount" error={amount !== "" ? (problem ?? undefined) : undefined}>
          <input id="supplierAmount" type="number" min={0} step="any" inputMode="decimal" placeholder={String(purchase.remaining)} value={amount} onChange={(event) => setAmount(event.target.value)} className={`${inputClass} tabular`} autoFocus />
        </FormField>
        <FormField label="Mode de paiement" htmlFor="supplierTender">
          <select id="supplierTender" value={tender} onChange={(event) => setTender(event.target.value as Tender)} className={selectClass}>
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
          <Button type="submit" loading={submitting} disabled={Boolean(problem)}>
            Enregistrer le paiement
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

/**
 * Annulation d'un achat saisi par erreur : le stock reçu est retiré par
 * contre-mouvement. Refusée par le serveur si des articles ont déjà été vendus.
 */
export function CancelPurchaseModal({
  purchase,
  currency,
  onClose,
  onCancelled,
}: {
  purchase: { id: number; paid: number } | null;
  currency: string;
  onClose: () => void;
  onCancelled: () => void;
}) {
  const { push } = useToast();
  const key = useIdempotencyKey();
  const [motif, setMotif] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  if (!purchase) return null;

  function close() {
    key.reset();
    setMotif("");
    setError(null);
    onClose();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!purchase || motif.trim().length < 3) return;
    setSubmitting(true);
    const result = await sendJson(`/api/purchases/${purchase.id}/cancel`, { motif: motif.trim() }, { idempotencyKey: key.get() });
    setSubmitting(false);
    if (!result.ok) return setError(result.message);
    push("Achat annulé : le stock reçu a été retiré", "success");
    key.reset();
    setMotif("");
    onCancelled();
    onClose();
  }

  return (
    <Modal open onClose={close} title={`Annuler l'achat ${documentNumber("ACH", purchase.id)}`} description="Les articles reçus sont retirés du stock par un contre-mouvement tracé." size="sm">
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        {purchase.paid > 0 && (
          <Alert tone="warning">
            {formatMoney(purchase.paid, currency)} ont déjà été versés au fournisseur : ces paiements restent dans l&apos;historique et sont à récupérer auprès de lui.
          </Alert>
        )}
        <FormField label="Motif de l'annulation" htmlFor="purchaseCancelMotif">
          <textarea id="purchaseCancelMotif" rows={2} value={motif} onChange={(event) => setMotif(event.target.value)} className={inputClass} placeholder="Ex : livraison saisie deux fois" autoFocus />
        </FormField>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={close} disabled={submitting}>
            Retour
          </Button>
          <Button type="submit" variant="danger" loading={submitting} disabled={motif.trim().length < 3}>
            Annuler l&apos;achat
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
