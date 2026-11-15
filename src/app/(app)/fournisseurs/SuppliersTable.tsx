import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { TableContainer, Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { SupplierFormModal, type SupplierRow } from "./SupplierFormModal";
import { sendJson } from "@/lib/mutation";

type Row = SupplierRow & { _count: { achats: number } };

const ICON_BUTTON =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-slate-300";

/**
 * Fournisseurs. Retirer un fournisseur ayant des achats (dettes comprises)
 * l'archive : il disparaît des listes et des nouveaux achats, son historique
 * reste intact. Seul un fournisseur sans aucun achat est supprimé.
 */
export function SuppliersTable({ suppliers, canDelete = false, showArchived = false }: { suppliers: Row[]; canDelete?: boolean; showArchived?: boolean }) {
  const router = useRouter();
  const { push } = useToast();
  const [editing, setEditing] = useState<Row | null>(null);
  const [removing, setRemoving] = useState<Row | null>(null);

  async function handleRemove() {
    if (!removing) return;
    const result = await sendJson<{ mode: "deleted" | "archived" }>(`/api/suppliers/${removing.id}`, {}, { method: "DELETE" });
    if (!result.ok) return push(result.message, "error");
    push(result.data.mode === "archived" ? "Fournisseur archivé : son historique est conservé" : "Fournisseur supprimé", "success");
    router.refresh();
  }

  async function handleRestore(supplier: Row) {
    const result = await sendJson(`/api/suppliers/${supplier.id}/restore`, {});
    if (!result.ok) return push(result.message, "error");
    push("Fournisseur restauré", "success");
    router.refresh();
  }

  if (suppliers.length === 0) {
    return showArchived ? (
      <EmptyState icon="truck" title="Aucun fournisseur archivé" description="Les fournisseurs archivés apparaissent ici." />
    ) : (
      <EmptyState icon="truck" title="Aucun fournisseur" description="Ajoutez vos fournisseurs pour suivre vos achats." />
    );
  }

  return (
    <>
      <TableContainer>
        <Table>
          <Thead>
            <tr>
              <Th>Nom</Th>
              <Th>Téléphone</Th>
              <Th>Email</Th>
              <Th className="text-right">Achats</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </Thead>
          <tbody>
            {suppliers.map((supplier) => (
              <Tr key={supplier.id}>
                <Td className="font-medium text-slate-900">{supplier.nom}</Td>
                <Td className="tabular">{supplier.telephone ?? "—"}</Td>
                <Td>{supplier.email ?? "—"}</Td>
                <Td className="tabular text-right">{supplier._count.achats}</Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-1">
                    {showArchived ? (
                      canDelete && (
                        <button type="button" onClick={() => void handleRestore(supplier)} className="rounded-md px-2 py-1 text-[13px] font-medium text-brand-700 hover:bg-brand-50">
                          Restaurer
                        </button>
                      )
                    ) : (
                      <>
                        <button type="button" onClick={() => setEditing(supplier)} aria-label="Modifier" className={ICON_BUTTON}>
                          <Icon name="edit" className="h-4 w-4" />
                        </button>
                        {canDelete && (
                          <button type="button" onClick={() => setRemoving(supplier)} aria-label="Retirer" className={`${ICON_BUTTON} hover:bg-red-50 hover:text-red-600`}>
                            <Icon name="trash" className="h-4 w-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableContainer>

      <SupplierFormModal open={Boolean(editing)} onClose={() => setEditing(null)} onSaved={() => router.refresh()} supplier={editing} />

      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        onConfirm={handleRemove}
        title={removing && removing._count.achats > 0 ? "Archiver ce fournisseur ?" : "Supprimer ce fournisseur ?"}
        description={
          removing && removing._count.achats > 0
            ? `« ${removing.nom} » a ${removing._count.achats} achat(s) : il sera archivé (masqué), ses achats et dettes restent rattachés à son nom.`
            : `« ${removing?.nom} » n'a aucun achat et sera définitivement supprimé.`
        }
        confirmLabel={removing && removing._count.achats > 0 ? "Archiver" : "Supprimer"}
        danger
      />
    </>
  );
}
