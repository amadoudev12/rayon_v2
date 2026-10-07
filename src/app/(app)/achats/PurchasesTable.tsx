import { useState } from "react";
import { TableContainer, Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatMoney, formatDateTime } from "@/lib/format";
import { PurchaseDetailsModal } from "./PurchaseDetailsModal";

type Purchase = {
  id: number;
  total: number | string;
  creeLe: string | Date;
  fournisseur: { id: number; nom: string } | null;
  lignes: { id: number; quantite: number; produit: { id: number; nom: string } }[];
};

export function PurchasesTable({ purchases, currency }: { purchases: Purchase[]; currency: string }) {
  const [viewingId, setViewingId] = useState<number | null>(null);

  if (purchases.length === 0) {
    return <EmptyState icon="truck" title="Aucun achat" description="Vos réceptions fournisseurs apparaîtront ici." />;
  }

  return (
    <>
      <TableContainer>
        <Table>
          <Thead>
            <tr>
              <Th>Achat</Th>
              <Th>Fournisseur</Th>
              <Th className="text-right">Articles</Th>
              <Th className="text-right">Total</Th>
              <Th>Date</Th>
            </tr>
          </Thead>
          <tbody>
            {purchases.map((purchase) => (
              <Tr key={purchase.id} onClick={() => setViewingId(purchase.id)}>
                <Td className="tabular font-medium text-slate-900">#{String(purchase.id).padStart(5, "0")}</Td>
                <Td>{purchase.fournisseur?.nom ?? "—"}</Td>
                <Td className="tabular text-right">{purchase.lignes.reduce((total, line) => total + line.quantite, 0)}</Td>
                <Td className="tabular text-right font-medium text-slate-900">{formatMoney(Number(purchase.total), currency)}</Td>
                <Td className="whitespace-nowrap text-slate-500">{formatDateTime(purchase.creeLe)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableContainer>

      <PurchaseDetailsModal purchaseId={viewingId} currency={currency} onClose={() => setViewingId(null)} />
    </>
  );
}
