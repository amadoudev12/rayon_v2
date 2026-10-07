import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { TableContainer, Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { formatMoney, formatDate } from "@/lib/format";
import { apiFetch } from "@/lib/api";

type Expense = {
  id: number;
  categorie: string;
  libelle: string;
  montant: number | string;
  date: string | Date;
  note: string | null;
};

export function ExpensesTable({ expenses, currency }: { expenses: Expense[]; currency: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [deleting, setDeleting] = useState<Expense | null>(null);

  async function handleDelete() {
    if (!deleting) return;
    const response = await apiFetch(`/api/expenses/${deleting.id}`, { method: "DELETE" });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      push(body?.message ?? "Suppression impossible", "error");
      return;
    }
    push("Dépense supprimée", "success");
    router.refresh();
  }

  if (expenses.length === 0) {
    return <EmptyState icon="wallet" title="Aucune dépense" description="Suivez vos charges pour estimer votre bénéfice réel." />;
  }

  return (
    <>
      <TableContainer>
        <Table>
          <Thead>
            <tr>
              <Th>Description</Th>
              <Th>Catégorie</Th>
              <Th className="text-right">Montant</Th>
              <Th>Date</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </Thead>
          <tbody>
            {expenses.map((expense) => (
              <Tr key={expense.id}>
                <Td className="font-medium text-slate-900">{expense.libelle}</Td>
                <Td>
                  <Badge>{expense.categorie}</Badge>
                </Td>
                <Td className="tabular text-right font-medium text-red-600">-{formatMoney(Number(expense.montant), currency)}</Td>
                <Td className="whitespace-nowrap text-slate-500">{formatDate(expense.date)}</Td>
                <Td className="text-right">
                  <button
                    type="button"
                    onClick={() => setDeleting(expense)}
                    aria-label="Supprimer"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 hover:bg-red-50 hover:text-red-600 focus-visible:ring-red-300"
                  >
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableContainer>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Supprimer cette dépense ?"
        description={`"${deleting?.libelle}" sera définitivement supprimée.`}
        confirmLabel="Supprimer"
        danger
      />
    </>
  );
}
