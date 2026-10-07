import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { TableContainer, Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { formatMoney } from "@/lib/format";
import { StockAdjustModal } from "../produits/StockAdjustModal";

type StockRow = {
  id: number;
  quantite: number;
  produit: { id: number; nom: string; unite: string; seuilAlerte: number; prixVente: number | string };
};

export function StockTable({
  stocks,
  canAdjust,
  currency,
}: {
  stocks: StockRow[];
  canAdjust: boolean;
  currency: string;
}) {
  const router = useRouter();
  const [adjusting, setAdjusting] = useState<StockRow | null>(null);

  if (stocks.length === 0) {
    return <EmptyState icon="layers" title="Aucun produit en stock" description="Vos niveaux de stock apparaîtront ici." />;
  }

  return (
    <>
      <TableContainer>
        <Table>
          <Thead>
            <tr>
              <Th>Produit</Th>
              <Th className="text-right">Prix de vente</Th>
              <Th className="text-right">Quantité</Th>
              <Th>Statut</Th>
            </tr>
          </Thead>
          <tbody>
            {stocks.map((stock) => {
              const isLow = stock.quantite <= stock.produit.seuilAlerte;
              return (
                <Tr key={stock.id}>
                  <Td className="font-medium text-slate-900">{stock.produit.nom}</Td>
                  <Td className="tabular text-right font-medium text-slate-900">{formatMoney(Number(stock.produit.prixVente), currency)}</Td>
                  <Td className="text-right">
                    {canAdjust ? (
                      <button
                        type="button"
                        onClick={() => setAdjusting(stock)}
                        title="Ajuster le stock"
                        className="tabular inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium text-slate-900 ring-1 ring-inset ring-slate-200 transition-colors hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200"
                      >
                        {stock.quantite} {stock.produit.unite}
                      </button>
                    ) : (
                      <span className="tabular font-medium text-slate-700">{`${stock.quantite} ${stock.produit.unite}`}</span>
                    )}
                  </Td>
                  <Td>
                    <Badge dot tone={stock.quantite === 0 ? "danger" : isLow ? "warning" : "success"}>
                      {stock.quantite === 0 ? "Rupture" : isLow ? "Stock faible" : "OK"}
                    </Badge>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </TableContainer>

      {adjusting && (
        <StockAdjustModal
          open={Boolean(adjusting)}
          onClose={() => setAdjusting(null)}
          onSaved={() => router.refresh()}
          productId={adjusting.produit.id}
          productName={adjusting.produit.nom}
          currentQuantity={adjusting.quantite}
        />
      )}
    </>
  );
}
