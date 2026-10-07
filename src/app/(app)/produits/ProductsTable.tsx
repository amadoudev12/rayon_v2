import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { TableContainer, Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { formatMoney } from "@/lib/format";
import { ProductFormModal, type ProductRow } from "./ProductFormModal";
import { StockAdjustModal } from "./StockAdjustModal";
import { ProductDetailsModal } from "./ProductDetailsModal";
import { apiFetch } from "@/lib/api";

export function ProductsTable({
  products,
  categories,
  canManage,
  currency,
}: {
  products: ProductRow[];
  categories: { id: number; nom: string }[];
  canManage: boolean;
  currency: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [viewing, setViewing] = useState<ProductRow | null>(null);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [adjusting, setAdjusting] = useState<ProductRow | null>(null);
  const [deleting, setDeleting] = useState<ProductRow | null>(null);

  async function handleDelete() {
    if (!deleting) return;
    const response = await apiFetch(`/api/products/${deleting.id}`, { method: "DELETE" });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      push(body?.message ?? "Suppression impossible", "error");
      return;
    }
    push("Produit supprimé", "success");
    router.refresh();
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon="box"
        title="Aucun produit"
        description="Ajoutez votre premier produit pour commencer à vendre."
      />
    );
  }

  return (
    <>
      <TableContainer>
        <Table>
          <Thead>
            <tr>
              <Th>Produit</Th>
              <Th>Catégorie</Th>
              <Th className="text-right">Prix de vente</Th>
              <Th className="text-right">Stock</Th>
              <Th>Statut</Th>
              {canManage && <Th className="text-right">Actions</Th>}
            </tr>
          </Thead>
          <tbody>
            {products.map((product) => (
              <Tr key={product.id} onClick={() => setViewing(product)}>
                <Td>
                  <p className="font-medium text-slate-900">{product.nom}</p>
                </Td>
                <Td>{categories.find((c) => c.id === product.categorieId)?.nom ?? "—"}</Td>
                <Td className="tabular text-right font-medium text-slate-900">{formatMoney(Number(product.prixVente), currency)}</Td>
                <Td className="text-right">
                  <button
                    type="button"
                    disabled={!canManage}
                    onClick={(event) => {
                      event.stopPropagation();
                      setAdjusting(product);
                    }}
                    className={canManage ? "tabular inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium text-slate-900 ring-1 ring-inset ring-slate-200 transition-colors hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200" : "tabular font-medium text-slate-700"}
                    title={canManage ? "Ajuster le stock" : undefined}
                  >
                    {product.quantiteStock ?? 0}
                  </button>
                </Td>
                <Td>
                  <Badge dot tone={product.actif ? "success" : "neutral"}>
                    {product.actif ? "Actif" : "Archivé"}
                  </Badge>
                </Td>
                {canManage && (
                  <Td className="text-right">
                    {/* Les boutons d'action ne doivent pas ouvrir le détail du produit. */}
                    <div className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setEditing(product)}
                        aria-label="Modifier"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-slate-300"
                      >
                        <Icon name="edit" className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(product)}
                        aria-label="Supprimer"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 hover:bg-red-50 hover:text-red-600 focus-visible:ring-red-300"
                      >
                        <Icon name="trash" className="h-4 w-4" />
                      </button>
                    </div>
                  </Td>
                )}
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableContainer>

      <ProductDetailsModal
        product={viewing}
        categoryName={categories.find((c) => c.id === viewing?.categorieId)?.nom ?? null}
        currency={currency}
        canManage={canManage}
        onClose={() => setViewing(null)}
        onEdit={() => {
          setEditing(viewing);
          setViewing(null);
        }}
        onAdjust={() => {
          setAdjusting(viewing);
          setViewing(null);
        }}
      />

      <ProductFormModal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        onSaved={() => router.refresh()}
        product={editing}
        categories={categories}
      />

      {adjusting && (
        <StockAdjustModal
          open={Boolean(adjusting)}
          onClose={() => setAdjusting(null)}
          onSaved={() => router.refresh()}
          productId={adjusting.id}
          productName={adjusting.nom}
          currentQuantity={adjusting.quantiteStock ?? 0}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Supprimer ce produit ?"
        description={`"${deleting?.nom}" sera définitivement supprimé. Cette action est impossible si le produit figure déjà dans des ventes.`}
        confirmLabel="Supprimer"
        danger
      />
    </>
  );
}
