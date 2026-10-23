import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { inputClass, selectClass } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/ToastProvider";
import { formatMoney } from "@/lib/format";
import { apiFetch } from "@/lib/api";

type Product = { id: number; nom: string; unite: string; prixAchat: number };
type Supplier = { id: number; nom: string };
type Line = { productId: number; name: string; unit: string; quantity: number; unitCost: number };

export function PurchaseFormModal({
  open,
  onClose,
  onSaved,
  products,
  suppliers,
  currency,
}: {
  open: boolean;
  onClose: () => void;
  /** Reçoit l'identifiant de l'achat créé (pour afficher son bon d'achat). */
  onSaved: (purchaseId: number) => void;
  products: Product[];
  suppliers: Supplier[];
  currency: string;
}) {
  const { push } = useToast();
  const [lines, setLines] = useState<Line[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [note, setNote] = useState("");
  // Vide : l'achat est payé en totalité.
  const [paidInput, setPaidInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const total = lines.reduce((sum, line) => sum + line.quantity * line.unitCost, 0);
  const paid = paidInput === "" ? total : Number(paidInput);
  const paidError = paid < 0 || paid > total ? "Le montant payé doit être compris entre 0 et le total." : null;
  const availableProducts = useMemo(
    () => products.filter((product) => !lines.some((line) => line.productId === product.id)),
    [products, lines],
  );

  function addLine() {
    const product = products.find((p) => p.id === Number(selectedProductId));
    if (!product) return;
    setLines((current) => [
      ...current,
      { productId: product.id, name: product.nom, unit: product.unite, quantity: 1, unitCost: product.prixAchat },
    ]);
    setSelectedProductId("");
  }

  function updateLine(productId: number, patch: Partial<Line>) {
    setLines((current) => current.map((line) => (line.productId === productId ? { ...line, ...patch } : line)));
  }

  function removeLine(productId: number) {
    setLines((current) => current.filter((line) => line.productId !== productId));
  }

  function reset() {
    setLines([]);
    setSupplierId("");
    setNote("");
    setPaidInput("");
  }

  async function submit() {
    if (lines.length === 0 || paidError) return;
    setSubmitting(true);
    try {
      const response = await apiFetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lignes: lines.map((line) => ({ produitId: line.productId, quantite: line.quantity, coutUnitaire: line.unitCost })),
          fournisseurId: supplierId ? Number(supplierId) : undefined,
          montantPaye: paidInput === "" ? undefined : paid,
          note: note || undefined,
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        push(body?.message ?? "Impossible d'enregistrer l'achat", "error");
        return;
      }
      push("Achat enregistré : stock et prix d'achat mis à jour", "success");
      reset();
      onClose();
      onSaved(body.data.id);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nouvel achat"
      description="Le stock est mis à jour dès l'enregistrement, et le coût saisi devient le prix d'achat du produit pour les prochaines ventes."
      size="lg"
    >
      <div className="space-y-5">
        <div>
          <label htmlFor="purchaseSupplier" className="mb-1.5 block text-[13px] font-medium text-slate-700">
            Fournisseur <span className="font-normal text-slate-400">(optionnel)</span>
          </label>
          <select
            id="purchaseSupplier"
            value={supplierId}
            onChange={(event) => setSupplierId(event.target.value)}
            className={selectClass}
          >
            <option value="">Aucun</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.nom}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="purchaseProduct" className="mb-1.5 block text-[13px] font-medium text-slate-700">
            Produits reçus
          </label>
          <div className="flex gap-2">
            <select
              id="purchaseProduct"
              value={selectedProductId}
              onChange={(event) => setSelectedProductId(event.target.value)}
              className={`${selectClass} flex-1`}
            >
              <option value="">Sélectionner un produit…</option>
              {availableProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.nom}
                </option>
              ))}
            </select>
            <Button type="button" variant="secondary" onClick={addLine} disabled={!selectedProductId}>
              <Icon name="plus" className="h-4 w-4" />
              Ajouter
            </Button>
          </div>
        </div>

        {lines.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-[13px] text-slate-500">
            Aucun produit ajouté pour le moment.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <div className="hidden grid-cols-[1fr_5rem_7rem_2rem] items-center gap-3 border-b border-slate-200/80 bg-slate-50/70 px-3 py-2 text-xs font-medium text-slate-500 sm:grid">
              <span>Produit</span>
              <span className="text-center">Quantité</span>
              <span className="text-right">Coût unitaire</span>
              <span />
            </div>
            <div className="divide-y divide-slate-100">
              {lines.map((line) => (
                <div
                  key={line.productId}
                  className="grid animate-fade-in grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 px-3 py-2.5 sm:grid-cols-[1fr_5rem_7rem_2rem]"
                >
                  <span className="truncate text-sm font-medium text-slate-900">{line.name}</span>
                  <button
                    type="button"
                    onClick={() => removeLine(line.productId)}
                    aria-label="Retirer"
                    className="inline-flex h-8 w-8 items-center justify-center justify-self-end rounded-lg text-slate-400 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 hover:bg-red-50 hover:text-red-600 focus-visible:ring-red-300 sm:order-last"
                  >
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(event) => updateLine(line.productId, { quantity: Math.max(1, Number(event.target.value)) })}
                    aria-label={`Quantité de ${line.name}`}
                    className={`${inputClass} tabular h-8 py-1 text-center`}
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={line.unitCost}
                    onChange={(event) => updateLine(line.productId, { unitCost: Math.max(0, Number(event.target.value)) })}
                    aria-label={`Coût unitaire de ${line.name}`}
                    className={`${inputClass} tabular h-8 py-1 text-right`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="purchaseNote" className="mb-1.5 block text-[13px] font-medium text-slate-700">
            Note <span className="font-normal text-slate-400">(optionnel)</span>
          </label>
          <input id="purchaseNote" value={note} onChange={(event) => setNote(event.target.value)} className={inputClass} />
        </div>

        <div>
          <label htmlFor="purchasePaid" className="mb-1.5 block text-[13px] font-medium text-slate-700">
            Montant payé au fournisseur <span className="font-normal text-slate-400">(vide = payé en totalité)</span>
          </label>
          <input
            id="purchasePaid"
            type="number"
            min={0}
            max={total}
            step="any"
            inputMode="decimal"
            value={paidInput}
            placeholder={String(total)}
            onChange={(event) => setPaidInput(event.target.value)}
            className={`${inputClass} tabular`}
          />
          {paidError ? (
            <p className="mt-1.5 text-xs font-medium text-red-600">{paidError}</p>
          ) : (
            total - paid > 0 && (
              <p className="mt-1.5 text-xs font-medium text-amber-700">Reste à payer : {formatMoney(total - paid, currency)}</p>
            )
          )}
        </div>

        <div className="-mx-5 flex flex-col gap-3 border-t border-slate-100 px-5 pt-4 sm:-mx-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-slate-500">
            Total{" "}
            <span className="tabular ml-1 text-lg font-semibold tracking-tight text-slate-900">{formatMoney(total, currency)}</span>
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button type="button" loading={submitting} disabled={lines.length === 0 || Boolean(paidError)} onClick={submit}>
              Enregistrer l&apos;achat
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
