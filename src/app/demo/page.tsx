import { useDocumentTitle } from "@/lib/document";
import { DemoPlayer } from "@/components/demo/DemoPlayer";

// Démonstration animée de l'application, publique et entièrement statique :
// aucune requête, uniquement des données d'exemple (`components/demo/data.ts`).

export default function DemoPage() {
  useDocumentTitle("Rayon — Démonstration", "Découvrez Rayon en moins d'une minute : tableau de bord, vente, stock et alertes.");
  return <DemoPlayer />;
}
