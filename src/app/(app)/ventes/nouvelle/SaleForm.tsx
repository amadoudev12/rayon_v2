import { useMemo, useState } from "react";
import { useRouter } from "@/lib/navigation";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { inputClass, selectClass } from "@/components/ui/FormField";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/ToastProvider";
import { formatMoney } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/labels";
import { apiFetch } from "@/lib/api";

type Product = { id: number; nom: string; unite: string; prixVente: number; quantiteStock: number };
type Customer = { id: number; nom: string };
type CartLine = { productId: number; name: string; unit: string; unitPrice: number; quantity: number; maxQuantity: number };

const PAYMENT_METHODS = Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({ value, label }));

export function SaleForm({
  products,
  customers: initialCustomers,
  currency,
}: {
  products: Product[];
  customers: Customer[];
  currency: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customers, setCustomers] = useState(initialCustomers);
  const [customerId, setCustomerId] = useState<string>("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [discount, setDiscount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products.slice(0, 20);
    return products.filter((product) => product.nom.toLowerCase().includes(term)).slice(0, 20);
  }, [products, search]);

  const subtotal = cart.reduce((total, line) => total + line.unitPrice * line.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  function addToCart(product: Product) {
    if (product.quantiteStock <= 0) return;
    setCart((current) => {
      const existing = current.find((line) => line.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.quantiteStock) return current;
        return current.map((line) =>
          line.productId === product.id ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [
        ...current,
        {
          productId: product.id,
          name: product.nom,
          unit: product.unite,
          unitPrice: product.prixVente,
          quantity: 1,
          maxQuantity: product.quantiteStock,
        },
      ];
    });
  }

  function updateQuantity(productId: number, quantity: number) {
    setCart((current) =>
      current
        .map((line) =>
          line.productId === productId
            ? { ...line, quantity: Math.max(1, Math.min(quantity, line.maxQuantity)) }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  function removeLine(productId: number) {
    setCart((current) => current.filter((line) => line.productId !== productId));
  }

  async function addCustomer() {
    if (!newCustomerName.trim()) return;
    const response = await apiFetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: newCustomerName.trim() }),
    });
    const body = await response.json();
    if (!response.ok) {
      push(body?.message ?? "Impossible d'ajouter ce client", "error");
      return;
    }
    setCustomers((current) => [...current, body.data]);
    setCustomerId(String(body.data.id));
    setNewCustomerName("");
  }

  async function submitSale() {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const response = await apiFetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lignes: cart.map((line) => ({ produitId: line.productId, quantite: line.quantity })),
          clientId: customerId ? Number(customerId) : undefined,
          modePaiement: paymentMethod,
          remise: discount,
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        push(body?.message ?? "Impossible d'enregistrer la vente", "error");
        return;
      }
      push("Vente enregistrée avec succès", "success");
      router.push("/ventes");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title="Produits" description="Cliquez sur un produit pour l'ajouter au panier." />
        <div className="p-4">
          <div className="relative mb-4">
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un produit à ajouter…"
              aria-label="Rechercher un produit"
              className={`${inputClass} h-10 pl-9`}
            />
          </div>

          {filteredProducts.length === 0 ? (
            <EmptyState compact icon="search" title="Aucun produit trouvé" description="Essayez un autre nom de produit." />
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 2xl:grid-cols-3">
              {filteredProducts.map((product) => {
                const outOfStock = product.quantiteStock <= 0;
                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={outOfStock}
                    onClick={() => addToCart(product)}
                    className="group flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left shadow-xs transition-[border-color,background-color,box-shadow] duration-150 hover:border-brand-300 hover:bg-brand-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 active:translate-y-px disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60 disabled:shadow-none"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{product.nom}</p>
                      <p className="tabular mt-0.5 text-xs text-slate-500">
                        <span className="font-medium text-slate-700">{formatMoney(product.prixVente, currency)}</span>
                        {" · "}
                        {outOfStock ? (
                          <span className="font-medium text-red-600">Rupture</span>
                        ) : (
                          `${product.quantiteStock} ${product.unite} en stock`
                        )}
                      </p>
                    </div>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-400 ring-1 ring-inset ring-slate-200 transition-colors group-hover:bg-brand-600 group-hover:text-white group-hover:ring-brand-600 group-disabled:bg-slate-50 group-disabled:text-slate-300 group-disabled:ring-slate-200">
                      <Icon name="plus" className="h-4 w-4" />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      <Card className="lg:sticky lg:top-20">
        <CardHeader title="Panier" description={cart.length === 0 ? "Aucun article" : `${cart.length} article(s)`} />
        <div className="scrollbar-thin max-h-80 divide-y divide-slate-100 overflow-y-auto">
          {cart.length === 0 ? (
            <EmptyState compact icon="cart" title="Panier vide" description="Ajoutez des produits pour commencer." />
          ) : (
            cart.map((line) => (
              <div key={line.productId} className="flex animate-fade-in items-center justify-between gap-2 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{line.name}</p>
                  <p className="tabular text-xs text-slate-500">
                    {formatMoney(line.unitPrice, currency)} × {line.quantity} ={" "}
                    <span className="font-medium text-slate-700">{formatMoney(line.unitPrice * line.quantity, currency)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex items-center rounded-lg border border-slate-200 bg-white shadow-xs">
                    <button
                      type="button"
                      onClick={() => updateQuantity(line.productId, line.quantity - 1)}
                      disabled={line.quantity <= 1}
                      aria-label="Diminuer la quantité"
                      className="flex h-8 w-7 items-center justify-center rounded-l-lg text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:text-slate-300 disabled:hover:bg-transparent"
                    >
                      <Icon name="minus" className="h-3.5 w-3.5" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={line.maxQuantity}
                      value={line.quantity}
                      onChange={(event) => updateQuantity(line.productId, Number(event.target.value))}
                      aria-label={`Quantité de ${line.name}`}
                      className="tabular h-8 w-10 border-x border-slate-200 text-center text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500/30"
                    />
                    <button
                      type="button"
                      onClick={() => updateQuantity(line.productId, line.quantity + 1)}
                      disabled={line.quantity >= line.maxQuantity}
                      aria-label="Augmenter la quantité"
                      className="flex h-8 w-7 items-center justify-center rounded-r-lg text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:text-slate-300 disabled:hover:bg-transparent"
                    >
                      <Icon name="plus" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(line.productId)}
                    aria-label="Retirer"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 hover:bg-red-50 hover:text-red-600 focus-visible:ring-red-300"
                  >
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-4 border-t border-slate-100 p-4">
          <div>
            <label htmlFor="saleCustomer" className="mb-1.5 block text-[13px] font-medium text-slate-700">
              Client <span className="font-normal text-slate-400">(optionnel)</span>
            </label>
            <select
              id="saleCustomer"
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
              className={selectClass}
            >
              <option value="">Client de passage</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.nom}
                </option>
              ))}
            </select>
            <div className="mt-2 flex gap-2">
              <input
                value={newCustomerName}
                onChange={(event) => setNewCustomerName(event.target.value)}
                placeholder="Nouveau client…"
                aria-label="Nom du nouveau client"
                className={`${inputClass} h-8 flex-1 py-1 text-[13px]`}
              />
              <Button type="button" size="sm" variant="secondary" onClick={addCustomer}>
                <Icon name="plus" className="h-3.5 w-3.5" />
                Ajouter
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="salePayment" className="mb-1.5 block text-[13px] font-medium text-slate-700">
                Paiement
              </label>
              <select
                id="salePayment"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className={selectClass}
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="saleDiscount" className="mb-1.5 block text-[13px] font-medium text-slate-700">
                Remise
              </label>
              <input
                id="saleDiscount"
                type="number"
                min={0}
                placeholder="0"
                // value={discount}
                onChange={(event) => setDiscount(Math.max(0, Number(event.target.value)))}
                className={`${inputClass} h-9`}
              />
            </div>
          </div>

          <dl className="tabular space-y-1.5 rounded-lg bg-slate-50 p-3 text-sm ring-1 ring-inset ring-slate-200/70">
            <div className="flex justify-between text-slate-500">
              <dt>Sous-total</dt>
              <dd>{formatMoney(subtotal, currency)}</dd>
            </div>
            <div className="flex justify-between text-slate-500">
              <dt>Remise</dt>
              <dd>-{formatMoney(discount, currency)}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-slate-200/80 pt-2 text-slate-900">
              <dt className="text-sm font-medium">Total</dt>
              <dd className="text-lg font-semibold tracking-tight">{formatMoney(total, currency)}</dd>
            </div>
          </dl>

          <Button className="w-full" size="lg" disabled={cart.length === 0} loading={submitting} onClick={submitSale}>
            Encaisser la vente
          </Button>
        </div>
      </Card>
    </div>
  );
}
