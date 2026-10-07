import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { TableContainer, Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { SupplierFormModal, type SupplierRow } from "./SupplierFormModal";
import { apiFetch } from "@/lib/api";

type Row = SupplierRow & { _count: { achats: number } };

export function SuppliersTable({ suppliers }: { suppliers: Row[] }) {
  const router = useRouter();
  const { push } = useToast();
  const [editing, setEditing] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);

  async function handleDelete() {
    if (!deleting) return;
    const response = await apiFetch(`/api/suppliers/${deleting.id}`, { method: "DELETE" });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      push(body?.message ?? "Suppression impossible", "error");
      return;
    }
    push("Fournisseur supprimé", "success");
    router.refresh();
  }

  if (suppliers.length === 0) {
    return <EmptyState icon="truck" title="Aucun fournisseur" description="Ajoutez vos fournisseurs pour suivre vos achats." />;
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
                    <button
                      type="button"
                      onClick={() => setEditing(supplier)}
                      aria-label="Modifier"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-slate-300"
                    >
                      <Icon name="edit" className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(supplier)}
                      aria-label="Supprimer"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 hover:bg-red-50 hover:text-red-600 focus-visible:ring-red-300"
                    >
                      <Icon name="trash" className="h-4 w-4" />
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableContainer>

      <SupplierFormModal open={Boolean(editing)} onClose={() => setEditing(null)} onSaved={() => router.refresh()} supplier={editing} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Supprimer ce fournisseur ?"
        description={`"${deleting?.nom}" sera définitivement supprimé.`}
        confirmLabel="Supprimer"
        danger
      />
    </>
  );
}
