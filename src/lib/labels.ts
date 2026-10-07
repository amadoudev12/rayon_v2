import type { PaymentMethod, StockMovementType } from "@/generated/prisma/enums";

/** Libellés affichés pour chaque mode de paiement. */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Espèces",
  CARD: "Carte",
  MOBILE_MONEY: "Mobile Money",
  CREDIT: "Crédit client",
  OTHER: "Autre",
};

/** Libellé et couleur de badge pour chaque type de mouvement de stock. */
export const MOVEMENT_LABELS: Record<StockMovementType, { label: string; tone: "success" | "danger" | "neutral" | "warning" }> = {
  PURCHASE: { label: "Achat", tone: "success" },
  SALE: { label: "Vente", tone: "danger" },
  SALE_CANCELLATION: { label: "Vente annulée", tone: "success" },
  ADJUSTMENT: { label: "Ajustement", tone: "warning" },
  INITIAL: { label: "Stock initial", tone: "neutral" },
};
