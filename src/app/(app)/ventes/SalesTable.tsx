import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { TableContainer, Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { formatMoney, formatDateTime } from "@/lib/format";
import { SaleDetailsModal } from "./SaleDetailsModal";
import { apiFetch } from "@/lib/api";

type Sale = {
  id: number;
  total: number | string;
  statut: string;
  creeLe: string | Date;
  lignes: { id: number; quantite: number; produit: { id: number; nom: string } }[];
  client: { id: number; nom: string } | null;
  vendeur: { id: number; prenom: string; nom: string };
};

export function SalesTable({ sales, canCancel, currency }: { sales: Sale[]; canCancel: boolean; currency: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<Sale | null>(null);

  async function handleCancel() {
    if (!cancelling) return;
    const response = await apiFetch(`/api/sales/${cancelling.id}/cancel`, { method: "POST" });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      push(body?.message ?? "Annulation impossible", "error");
      return;
    }
    push("Vente annulée, le stock a été recrédité", "success");
    router.refresh();
  }

  if (sales.length === 0) {
    return <EmptyState icon="receipt" title="Aucune vente" description="Vos ventes enregistrées apparaîtront ici." />;
  }

  return (
    <>
      <TableContainer>
        <Table>
          <Thead>
            <tr>
              <Th>Vente</Th>
              <Th>Client</Th>
              <Th>Vendeur</Th>
              <Th className="text-right">Articles</Th>
              <Th className="text-right">Total</Th>
              <Th>Statut</Th>
              <Th>Date</Th>
              {canCancel && <Th className="text-right">Actions</Th>}
            </tr>
          </Thead>
          <tbody>
            {sales.map((sale) => (
              <Tr key={sale.id} onClick={() => setViewingId(sale.id)}>
                <Td className="tabular font-medium text-slate-900">#{String(sale.id).padStart(5, "0")}</Td>
                <Td>{sale.client?.nom ?? "Client de passage"}</Td>
                <Td>
                  {sale.vendeur.prenom} {sale.vendeur.nom}
                </Td>
                <Td className="tabular text-right">{sale.lignes.reduce((total, line) => total + line.quantite, 0)}</Td>
                <Td className={`tabular text-right font-medium ${sale.statut === "CANCELLED" ? "text-slate-400 line-through" : "text-slate-900"}`}>
                  {formatMoney(Number(sale.total), currency)}
                </Td>
                <Td>
                  <Badge dot tone={sale.statut === "CANCELLED" ? "danger" : "success"}>
                    {sale.statut === "CANCELLED" ? "Annulée" : "Terminée"}
                  </Badge>
                </Td>
                <Td className="whitespace-nowrap text-slate-500">{formatDateTime(sale.creeLe)}</Td>
                {canCancel && (
                  <Td className="text-right">
                    {sale.statut !== "CANCELLED" && (
                      <button
                        type="button"
                        onClick={(event) => {
                          // Le bouton ne doit pas aussi ouvrir le détail de la vente.
                          event.stopPropagation();
                          setCancelling(sale);
                        }}
                        className="rounded-md px-2 py-1 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-50"
                      >
                        Annuler
                      </button>
                    )}
                  </Td>
                )}
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableContainer>

      <SaleDetailsModal
        saleId={viewingId}
        currency={currency}
        canCancel={canCancel}
        onClose={() => setViewingId(null)}
        onCancel={() => {
          setCancelling(sales.find((sale) => sale.id === viewingId) ?? null);
          setViewingId(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(cancelling)}
        onClose={() => setCancelling(null)}
        onConfirm={handleCancel}
        title="Annuler cette vente ?"
        description="Les quantités vendues seront recréditées au stock. Cette action est définitive."
        confirmLabel="Annuler la vente"
        danger
      />
    </>
  );
}
