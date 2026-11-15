import { useState } from "react";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { FormField, inputClass, selectClass } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/ToastProvider";
import { documentNumber, formatMoney, formatNumber } from "@/lib/format";
import { TENDER_OPTIONS, type Tender } from "@/lib/labels";
import { sendJson, useIdempotencyKey } from "@/lib/mutation";

export type ReturnTarget = {
  id: number;
  sousTotal: number;
  total: number;
  resteAPayer: number;
  lignes: { id: number; produit: { nom: string; unite: string }; quantite: number; quantiteRestante: number; prixUnitaire: number }[];
};

type LineState = { quantite: string; remiseEnStock: boolean };

/**
 * Retour d'articles : quantités par ligne (au plus ce qui n'a pas déjà été
 * retourné), article revendable ou non, motif. L'avoir exact est calculé par
 * le serveur (remise répartie au centime) ; l'estimation affichée ici n'est
 * qu'indicative.
 */
export function ReturnModal({
  sale,
  currency,
  onClose,
  onSaved,
}: {
  sale: ReturnTarget | null;
  currency: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { push } = useToast();
  const key = useIdempotencyKey();
  const [lines, setLines] = useState<Record<number, LineState>>({});
  const [motif, setMotif] = useState("");
  const [refundNow, setRefundNow] = useState(true);
  const [tender, setTender] = useState<Tender>("CASH");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!sale) return null;

  const ratio = sale.sousTotal > 0 ? sale.total / sale.sousTotal : 0;
  const state = (id: number): LineState => lines[id] ?? { quantite: "", remiseEnStock: true };
  const selected = sale.lignes
    .map((line) => ({ line, quantite: Number(state(line.id).quantite || 0), remiseEnStock: state(line.id).remiseEnStock }))
    .filter((entry) => entry.quantite > 0);
  const invalid = sale.lignes.some((line) => {
    const raw = state(line.id).quantite;
    if (raw === "") return false;
    const value = Number(raw);
    return !Number.isInteger(value) || value < 0 || value > line.quantiteRestante;
  });
  const estimate = selected.reduce((sum, entry) => sum + entry.quantite * entry.line.prixUnitaire * ratio, 0);
  const estimatedRefund = Math.max(0, estimate - sale.resteAPayer);
  const canSubmit = selected.length > 0 && !invalid && motif.trim().length >= 3;

  function update(id: number, patch: Partial<LineState>) {
    setLines((current) => ({ ...current, [id]: { ...state(id), ...patch } }));
  }

  function close() {
    key.reset();
    setLines({});
    setMotif("");
    setError(null);
    onClose();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!sale || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    const result = await sendJson(
      `/api/sales/${sale.id}/returns`,
      {
        motif: motif.trim(),
        lignes: selected.map((entry) => ({ ligneVenteId: entry.line.id, quantite: entry.quantite, remiseEnStock: entry.remiseEnStock })),
        ...(refundNow && estimatedRefund > 0 ? { remboursementImmediat: { modePaiement: tender } } : {}),
      },
      { idempotencyKey: key.get() },
    );
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    push("Retour enregistré : avoir, stock et solde du client mis à jour", "success");
    key.reset();
    setLines({});
    setMotif("");
    onSaved();
    onClose();
  }

  return (
    <Modal open onClose={close} title={`Retour d'articles — ${documentNumber("VTE", sale.id)}`} description="Seuls les articles revendables reviennent en stock ; les autres sont comptés en pertes." size="lg">
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}

        <div className="scrollbar-thin overflow-x-auto rounded-lg border border-slate-200/80">
          <table className="w-full min-w-md text-left text-sm">
            <thead className="border-b border-slate-200/80 bg-slate-50/70 text-xs font-medium text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Article</th>
                <th className="px-3 py-2 text-right font-medium">Retournable</th>
                <th className="px-3 py-2 font-medium">Quantité retournée</th>
                <th className="px-3 py-2 font-medium">Revendable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sale.lignes.map((line) => (
                <tr key={line.id} className={line.quantiteRestante === 0 ? "text-slate-400" : ""}>
                  <td className="px-3 py-2">
                    {line.produit.nom}
                    <span className="block text-xs text-slate-500">{formatMoney(line.prixUnitaire, currency)} / {line.produit.unite}</span>
                  </td>
                  <td className="tabular px-3 py-2 text-right">
                    {formatNumber(line.quantiteRestante)} / {formatNumber(line.quantite)}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      max={line.quantiteRestante}
                      step={1}
                      aria-label={`Quantité retournée pour ${line.produit.nom}`}
                      disabled={line.quantiteRestante === 0}
                      value={state(line.id).quantite}
                      onChange={(event) => update(line.id, { quantite: event.target.value })}
                      className={`${inputClass} tabular w-24`}
                      placeholder="0"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        disabled={line.quantiteRestante === 0}
                        checked={state(line.id).remiseEnStock}
                        onChange={(event) => update(line.id, { remiseEnStock: event.target.checked })}
                      />
                      Remettre en stock
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {invalid && <p className="text-xs font-medium text-red-600">Une quantité dépasse ce qui peut encore être retourné.</p>}

        <FormField label="Motif du retour" htmlFor="returnMotif">
          <textarea id="returnMotif" rows={2} value={motif} onChange={(event) => setMotif(event.target.value)} className={inputClass} placeholder="Ex : article défectueux" />
        </FormField>

        {selected.length > 0 && (
          <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-sm ring-1 ring-inset ring-slate-200/70">
            <p className="text-slate-600">
              Avoir estimé : <span className="font-semibold text-slate-900">{formatMoney(estimate, currency)}</span>
              {sale.resteAPayer > 0 && <span className="block text-xs">Il réduit d'abord ce que le client doit encore ({formatMoney(sale.resteAPayer, currency)}).</span>}
            </p>
            {estimatedRefund > 0 && (
              <>
                <label className="flex items-center gap-2 text-slate-700">
                  <input type="checkbox" checked={refundNow} onChange={(event) => setRefundNow(event.target.checked)} />
                  Je rends environ {formatMoney(estimatedRefund, currency)} au client maintenant
                </label>
                {refundNow && (
                  <select aria-label="Mode de remboursement" value={tender} onChange={(event) => setTender(event.target.value as Tender)} className={selectClass}>
                    {TENDER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              </>
            )}
          </div>
        )}

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={close} disabled={submitting}>
            Annuler
          </Button>
          <Button type="submit" loading={submitting} disabled={!canSubmit}>
            Enregistrer le retour
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
