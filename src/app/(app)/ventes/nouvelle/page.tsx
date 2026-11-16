import { useCallback, useRef, useState, type ComponentProps } from "react";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { loadPage } from "@/lib/api";
import { useRouter } from "@/lib/navigation";
import { sendJson } from "@/lib/mutation";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { SaleForm, clearStoredDraft, type QuoteToConvert, type SaleDraft } from "./SaleForm";
import { HeldSalesPanel, type HeldSale } from "./HeldSalesPanel";

type NewSalePageData = Pick<ComponentProps<typeof SaleForm>, "products" | "customers" | "currency" | "pricing"> & {
  /** Boutique de la vente (brouillon et ventes en attente sont propres à chaque boutique). */
  storeId: number;
  /** Présent avec `?devis=ID` : devis à transformer en vente. */
  quote: QuoteToConvert | null;
};

export function loader({ request }: LoaderFunctionArgs) {
  return loadPage<NewSalePageData>("/ventes/nouvelle", request);
}

export default function NewSalePage() {
  const router = useRouter();
  const { push } = useToast();
  const { products, customers, currency, pricing, quote, storeId } = useLoaderData<NewSalePageData>();
  // Changer la clé repart d'un nouveau formulaire (vide, ou la vente reprise).
  const [formKey, setFormKey] = useState(0);
  const [resumedDraft, setResumedDraft] = useState<SaleDraft | null>(null);
  const [heldVersion, setHeldVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<HeldSale | null>(null);
  const currentDraft = useRef<SaleDraft | null>(null);
  const onDraftChange = useCallback((draft: SaleDraft | null) => {
    currentDraft.current = draft;
  }, []);

  /** Repart d'un panier vide (après encaissement ou mise en attente). */
  function restart() {
    setResumedDraft(null);
    setFormKey((value) => value + 1);
    setHeldVersion((value) => value + 1);
    // Le rechargement met le stock à jour ; sans `devis`, la vente suivante part d'un panier vide.
    router.push("/ventes/nouvelle");
  }

  async function resume(sale: HeldSale) {
    setBusy(true);
    try {
      // La vente en cours n'est jamais perdue : elle est mise en attente d'abord.
      if (currentDraft.current) {
        const parked = await sendJson(`/api/held-sales?storeId=${storeId}`, { panier: currentDraft.current });
        if (!parked.ok) return push(`La vente en cours n'a pas pu être mise en attente : ${parked.message}`, "error");
      }
      const result = await sendJson<{ libelle: string; panier: SaleDraft }>(`/api/held-sales/${sale.id}/resume?storeId=${storeId}`, {});
      if (!result.ok) {
        push(result.message, "error");
        setHeldVersion((value) => value + 1);
        return;
      }
      clearStoredDraft(storeId);
      currentDraft.current = null;
      setResumedDraft(result.data.panier);
      setFormKey((value) => value + 1);
      setHeldVersion((value) => value + 1);
      push(`Vente « ${result.data.libelle} » reprise`, "success");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function removeHeld() {
    if (!deleting) return;
    const result = await sendJson(`/api/held-sales/${deleting.id}?storeId=${storeId}`, {}, { method: "DELETE" });
    if (!result.ok) push(result.message, "error");
    else push("Vente en attente supprimée", "success");
    setHeldVersion((value) => value + 1);
  }

  return (
    <div>
      <PageHeader
        title={quote ? "Transformer un devis en vente" : "Nouvelle vente"}
        description="Ajoutez des produits au panier puis encaissez. Un client long à servir ? Mettez sa vente en attente."
      />
      {!quote && (
        <HeldSalesPanel storeId={storeId} currency={currency} version={heldVersion} busy={busy} onResume={(sale) => void resume(sale)} onDelete={setDeleting} />
      )}
      <SaleForm
        key={`${formKey}-${quote?.id ?? ""}`}
        products={products}
        customers={customers}
        currency={currency}
        pricing={pricing}
        fromQuote={quote}
        storeId={storeId}
        initialDraft={resumedDraft}
        onDraftChange={onDraftChange}
        onHeld={restart}
        onRestart={restart}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={removeHeld}
        title="Supprimer cette vente en attente ?"
        description={`Le panier « ${deleting?.libelle ?? ""} » sera abandonné. Rien n'avait été encaissé ni retiré du stock.`}
        confirmLabel="Supprimer"
        danger
      />
    </div>
  );
}
