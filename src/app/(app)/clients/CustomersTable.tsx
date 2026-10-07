import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { TableContainer, Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { CustomerFormModal, type CustomerRow } from "./CustomerFormModal";
import { apiFetch } from "@/lib/api";

type Row = CustomerRow & { _count: { ventes: number } };

export function CustomersTable({ customers, canManage }: { customers: Row[]; canManage: boolean }) {
  const router = useRouter();
  const { push } = useToast();
  const [editing, setEditing] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);

  async function handleDelete() {
    if (!deleting) return;
    const response = await apiFetch(`/api/customers/${deleting.id}`, { method: "DELETE" });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      push(body?.message ?? "Suppression impossible", "error");
      return;
    }
    push("Client supprimé", "success");
    router.refresh();
  }

  if (customers.length === 0) {
    return <EmptyState icon="users" title="Aucun client" description="Ajoutez vos clients pour suivre leurs achats." />;
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
              <Th className="text-right">Ventes</Th>
              {canManage && <Th className="text-right">Actions</Th>}
            </tr>
          </Thead>
          <tbody>
            {customers.map((customer) => (
              <Tr key={customer.id}>
                <Td className="font-medium text-slate-900">{customer.nom}</Td>
                <Td className="tabular">{customer.telephone ?? "—"}</Td>
                <Td>{customer.email ?? "—"}</Td>
                <Td className="tabular text-right">{customer._count.ventes}</Td>
                {canManage && (
                  <Td className="text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(customer)}
                        aria-label="Modifier"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-slate-300"
                      >
                        <Icon name="edit" className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(customer)}
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

      <CustomerFormModal open={Boolean(editing)} onClose={() => setEditing(null)} onSaved={() => router.refresh()} customer={editing} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Supprimer ce client ?"
        description={`"${deleting?.nom}" sera définitivement supprimé.`}
        confirmLabel="Supprimer"
        danger
      />
    </>
  );
}
