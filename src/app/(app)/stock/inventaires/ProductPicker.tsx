import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { inputClass } from "@/components/ui/FormField";

export type PickedProduct = { id: number; nom: string; reference: string | null };

/**
 * Sélection manuelle de produits par recherche côté serveur (20 résultats
 * par saisie) : le catalogue n'est jamais chargé en entier, quelle que soit sa taille.
 */
export function ProductPicker({ selected, onChange }: { selected: PickedProduct[]; onChange: (products: PickedProduct[]) => void }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<PickedProduct[]>([]);

  useEffect(() => {
    const term = search.trim();
    let cancelled = false;
    const timer = setTimeout(() => {
      if (term.length < 2) {
        if (!cancelled) setResults([]);
        return;
      }
      apiFetch(`/api/products?status=active&limit=20&search=${encodeURIComponent(term)}`)
        .then(async (response) => (response.ok ? ((await response.json()) as { data: PickedProduct[] }).data : []))
        .then((data) => !cancelled && setResults(data))
        .catch(() => !cancelled && setResults([]));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  const selectedIds = new Set(selected.map((product) => product.id));

  return (
    <div className="space-y-2">
      <input value={search} onChange={(event) => setSearch(event.target.value)} className={inputClass} placeholder="Rechercher un produit (2 lettres au moins)…" aria-label="Rechercher un produit à inclure" />
      {results.length > 0 && (
        <ul className="max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200/80 text-sm">
          {results.map((product) => (
            <li key={product.id}>
              <label className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={selectedIds.has(product.id)}
                  onChange={(event) => onChange(event.target.checked ? [...selected, product] : selected.filter((item) => item.id !== product.id))}
                />
                {product.nom}
                {product.reference && <span className="text-xs text-slate-500">· {product.reference}</span>}
              </label>
            </li>
          ))}
        </ul>
      )}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => onChange(selected.filter((item) => item.id !== product.id))}
              className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-200/70 hover:bg-brand-100"
              aria-label={`Retirer ${product.nom}`}
            >
              {product.nom} ×
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
