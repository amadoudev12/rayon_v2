import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { TableContainer, Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { CustomerFormModal, type CustomerRow } from "./CustomerFormModal";
import { sendJson } from "@/lib/mutation";

type Row = CustomerRow & { _count: { ventes: number } };

const ICON_BUTTON =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-slate-300";

/**
 * Clients. Retirer un client ayant des ventes (créances comprises) l'archive :
 * il disparaît des listes et des nouvelles ventes, son historique reste intact.
 * Seul un client sans aucune opération est supprimé définitivement.
 */
export function CustomersTable({
  customers,
  canManage,
  canDelete = false,
  showArchived = false,
}: {
  customers: Row[];
  canManage: boolean;
  canDelete?: boolean;
  showArchived?: boolean;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [editing, setEditing] = useState<Row | null>(null);
  const [removing, setRemoving] = useState<Row | null>(null);

  async function handleRemove() {
    if (!removing) return;
    const result = await sendJson<{ mode: "deleted" | "archived" }>(`/api/customers/${removing.id}`, {}, { method: "DELETE" });
    if (!result.ok) return push(result.message, "error");
    push(result.data.mode === "archived" ? "Client archivé : son historique est conservé" : "Client supprimé", "success");
    router.refresh();
  }

  async function handleRestore(customer: Row) {
    const result = await sendJson(`/api/customers/${customer.id}/restore`, {});
    if (!result.ok) return push(result.message, "error");
    push("Client restauré", "success");
    router.refresh();
  }

  if (customers.length === 0) {
    return showArchived ? (
      <EmptyState icon="users" title="Aucun client archivé" description="Les clients archivés apparaissent ici." />
    ) : (
      <EmptyState icon="users" title="Aucun client" description="Ajoutez vos clients pour suivre leurs achats." />
    );
  }

  const showActions = showArchived ? canDelete : canManage || canDelete;

  return (
    <>
      <TableContainer>
        <Table>
          <Thead>
            <tr>
              <Th>Nom</Th>
              <Th>Téléphone</Th>
              <Th>Email</Th>
              <Th className="text-right">Ventes</Th>
              {showActions && <Th className="text-right">Actions</Th>}
            </tr>
          </Thead>
          <tbody>
            {customers.map((customer) => (
              <Tr key={customer.id}>
                <Td className="font-medium text-slate-900">{customer.nom}</Td>
                <Td className="tabular">{customer.telephone ?? "—"}</Td>
                <Td>{customer.email ?? "—"}</Td>
                <Td className="tabular text-right">{customer._count.ventes}</Td>
                {showActions && (
                  <Td className="text-right">
                    <div className="flex justify-end gap-1">
                      {showArchived ? (
                        <button type="button" onClick={() => void handleRestore(customer)} className="rounded-md px-2 py-1 text-[13px] font-medium text-brand-700 hover:bg-brand-50">
                          Restaurer
                        </button>
                      ) : (
                        <>
                          {canManage && (
                            <button type="button" onClick={() => setEditing(customer)} aria-label="Modifier" className={ICON_BUTTON}>
                              <Icon name="edit" className="h-4 w-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button type="button" onClick={() => setRemoving(customer)} aria-label="Retirer" className={`${ICON_BUTTON} hover:bg-red-50 hover:text-red-600`}>
                              <Icon name="trash" className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </Td>
                )}
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableContainer>

      <CustomerFormModal open={Boolean(editing)} onClose={() => setEditing(null)} onSaved={() => router.refresh()} customer={editing} />

      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        onConfirm={handleRemove}
        title={removing && removing._count.ventes > 0 ? "Archiver ce client ?" : "Supprimer ce client ?"}
        description={
          removing && removing._count.ventes > 0
            ? `« ${removing.nom} » a ${removing._count.ventes} vente(s) : il sera archivé (masqué), ses ventes et créances restent rattachées à son nom.`
            : `« ${removing?.nom} » n'a aucune opération et sera définitivement supprimé.`
        }
        confirmLabel={removing && removing._count.ventes > 0 ? "Archiver" : "Supprimer"}
        danger
      />
    </>
  );
}
