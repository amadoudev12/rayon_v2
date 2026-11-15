import { useParams } from "react-router";
import { PageHeader } from "@/components/ui/PageHeader";
import { InventoryDetail } from "./InventoryDetail";
import { InventoryList } from "./InventoryList";

/** Inventaires physiques : liste et démarrage, ou comptage d'une session (`/stock/inventaires/:id`). */
export default function InventoriesPage() {
  const { id } = useParams();
  const inventoryId = Number(id);
  return (
    <div>
      <PageHeader
        title={id ? "Comptage d'inventaire" : "Inventaires physiques"}
        description="Les quantités théoriques sont figées au démarrage de chaque session."
      />
      {id && Number.isInteger(inventoryId) && inventoryId > 0 ? <InventoryDetail key={inventoryId} id={inventoryId} /> : <InventoryList />}
    </div>
  );
}
