import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { FormField, inputClass, selectClass } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/ToastProvider";
import { apiFetch } from "@/lib/api";
import { sendJson, useIdempotencyKey } from "@/lib/mutation";
import type { LossReasonOption } from "./page";

type Product = { id: number; nom: string; reference: string | null; unite: string; quantiteStock: number };

/**
 * Déclaration d'une perte dans la boutique active. Le produit se cherche
 * côté serveur (le catalogue n'est jamais chargé en entier) et la même clé
 * d'idempotence est réutilisée jusqu'au succès : un double clic ou un nouvel
 * essai après une coupure ne retire jamais le stock deux fois.
 */
export function LossForm({ reasons, onDeclared }: { reasons: LossReasonOption[]; onDeclared: () => void }) {
  const { push } = useToast();
  const idempotency = useIdempotencyKey();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState(reasons[0]?.value ?? "");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const term = search.trim();
    let cancelled = false;
    const timer = setTimeout(() => {
      if (term.length < 2) {
        if (!cancelled) setResults([]);
        return;
      }
      apiFetch(`/api/products?status=active&limit=20&search=${encodeURIComponent(term)}`)
        .then(async (response) => (response.ok ? ((await response.json()) as { data: Product[] }).data : []))
        .then((data) => !cancelled && setResults(data))
        .catch(() => !cancelled && setResults([]));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  const amount = Number(quantity);
  const quantityError =
    product && (!Number.isInteger(amount) || amount < 1)
      ? "Saisissez une quantité entière d'au moins 1."
      : product && amount > product.quantiteStock
        ? `Stock disponible : ${product.quantiteStock} ${product.unite}.`
        : undefined;

  function choose(next: Product | null) {
    setProduct(next);
    setSearch("");
    setResults([]);
    idempotency.reset();
  }

  async function submit() {
    if (!product || quantityError) return;
    setBusy(true);
    setError(null);
    const result = await sendJson<{ reference: string }>(
      "/api/losses",
      { produitId: product.id, quantite: amount, motif: reason, description: description.trim() || undefined },
      { idempotencyKey: idempotency.get() },
    );
    setBusy(false);
    if (!result.ok) return setError(result.message);
    idempotency.reset();
    push(`Perte ${result.data.reference} enregistrée : stock retiré`, "success");
    setProduct(null);
    setQuantity("1");
    setDescription("");
    onDeclared();
  }

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-slate-900">Déclarer une perte</h2>
      <p className="mt-0.5 text-xs text-slate-500">La perte est valorisée au coût d&apos;achat actuel du produit et retirée du stock de la boutique.</p>
      {error && <Alert className="mt-4">{error}</Alert>}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <FormField label="Produit" htmlFor="lossProduct">
            {product ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <span>
                  <span className="font-medium text-slate-900">{product.nom}</span>
                  <span className="block text-xs text-slate-500">
                    Stock : {product.quantiteStock} {product.unite}
                    {product.reference ? ` · Réf. ${product.reference}` : ""}
                  </span>
                </span>
                <button type="button" onClick={() => choose(null)} className="text-sm font-medium text-brand-700 hover:underline">
                  Changer
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  id="lossProduct"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className={inputClass}
                  placeholder="Rechercher un produit (2 lettres au moins)…"
                  autoComplete="off"
                />
                {results.length > 0 && (
                  <ul className="max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200/80 text-sm">
                    {results.map((candidate) => (
                      <li key={candidate.id}>
                        <button
                          type="button"
                          disabled={candidate.quantiteStock <= 0}
                          onClick={() => choose(candidate)}
                          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="font-medium text-slate-900">{candidate.nom}</span>
                          <span className="text-xs text-slate-500">
                            {candidate.quantiteStock > 0 ? `Stock : ${candidate.quantiteStock} ${candidate.unite}` : "Épuisé"}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </FormField>
        </div>
        <FormField label="Quantité perdue" htmlFor="lossQuantity" error={quantityError}>
          <input
            id="lossQuantity"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={quantity}
            onChange={(event) => {
              setQuantity(event.target.value);
              idempotency.reset();
            }}
            className={inputClass}
          />
        </FormField>
        <FormField label="Motif" htmlFor="lossReason">
          <select
            id="lossReason"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              idempotency.reset();
            }}
            className={selectClass}
          >
            {reasons.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
        <div className="md:col-span-2">
          <FormField label="Précisions (facultatif)" htmlFor="lossDescription">
            <textarea
              id="lossDescription"
              rows={2}
              maxLength={1000}
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                idempotency.reset();
              }}
              className={inputClass}
              placeholder="Ex. : carton tombé à la livraison"
            />
          </FormField>
        </div>
      </div>
      <Button className="mt-4" loading={busy} disabled={!product || Boolean(quantityError)} onClick={() => void submit()}>
        Enregistrer la perte
      </Button>
    </Card>
  );
}
