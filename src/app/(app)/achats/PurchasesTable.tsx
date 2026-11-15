import { useState } from "react";
import { TableContainer, Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { documentNumber, formatMoney, formatDateTime } from "@/lib/format";
import { PurchaseDetailsModal } from "./PurchaseDetailsModal";
import { useRouter } from "@/lib/navigation";

type Purchase = {
  id: number;
  total: number | string;
  montantPaye: number;
  resteAPayer: number;
  statut: "RECEIVED" | "CANCELLED";
  creeLe: string | Date;
  fournisseur: { id: number; nom: string } | null;
  lignes: { id: number; quantite: number; produit: { id: number; nom: string } }[];
};

export function PurchasesTable({ purchases, currency, canCancel = false }: { purchases: Purchase[]; currency: string; canCancel?: boolean }) {
  const router = useRouter();
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
              <Th>Paiement</Th>
              <Th>Date</Th>
            </tr>
          </Thead>
          <tbody>
            {purchases.map((purchase) => (
              <Tr key={purchase.id} onClick={() => setViewingId(purchase.id)}>
                <Td className="tabular whitespace-nowrap font-medium text-slate-900">{documentNumber("ACH", purchase.id)}</Td>
                <Td>{purchase.fournisseur?.nom ?? "—"}</Td>
                <Td className="tabular text-right">{purchase.lignes.reduce((total, line) => total + line.quantite, 0)}</Td>
                <Td className="tabular text-right font-medium text-slate-900">{formatMoney(Number(purchase.total), currency)}</Td>
                <Td>
                  {purchase.statut === "CANCELLED" ? (
                    <Badge dot tone="danger">Annulé</Badge>
                  ) : purchase.resteAPayer > 0 ? (
                    <Badge dot tone="warning">Reste {formatMoney(purchase.resteAPayer, currency)}</Badge>
                  ) : (
                    <Badge dot tone="success">Payé</Badge>
                  )}
                </Td>
                <Td className="whitespace-nowrap text-slate-500">{formatDateTime(purchase.creeLe)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableContainer>

      <PurchaseDetailsModal purchaseId={viewingId} currency={currency} canPay canCancel={canCancel} onClose={() => setViewingId(null)} onChanged={() => router.refresh()} />
    </>
  );
}
