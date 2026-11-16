import type { PaymentMethod } from "@/generated/prisma/enums";

/** Libellés affichés pour chaque mode de paiement. */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Espèces",
  CARD: "Carte",
  MOBILE_MONEY: "Mobile Money",
  CREDIT: "Crédit client",
  OTHER: "Autre",
};

/** Modes par lesquels de l'argent change réellement de main (jamais « crédit »). */
export type Tender = Exclude<PaymentMethod, "CREDIT">;
export const TENDER_OPTIONS: { value: Tender; label: string }[] = [
  { value: "CASH", label: PAYMENT_METHOD_LABELS.CASH },
  { value: "MOBILE_MONEY", label: PAYMENT_METHOD_LABELS.MOBILE_MONEY },
  { value: "CARD", label: PAYMENT_METHOD_LABELS.CARD },
  { value: "OTHER", label: PAYMENT_METHOD_LABELS.OTHER },
];

/** État financier d'une vente, calculé par le serveur. */
export const SETTLEMENT_LABELS: Record<string, { label: string; tone: "success" | "warning" | "danger" }> = {
  SOLDEE: { label: "Soldée", tone: "success" },
  CREANCE: { label: "Créance en cours", tone: "warning" },
  REMBOURSEMENT_EN_ATTENTE: { label: "Remboursement à verser", tone: "danger" },
};

export const CANCELLATION_LABELS: Record<string, string> = {
  REFUND: "Annulée avec remboursement",
  ENTRY_ERROR: "Annulée — erreur de saisie",
  LEGACY: "Annulée (historique)",
};

/** Libellé et couleur de badge pour chaque type de mouvement de stock. */
export const MOVEMENT_LABELS: Record<string, { label: string; tone: "success" | "danger" | "neutral" | "warning" }> = {
  PURCHASE: { label: "Achat", tone: "success" },
  SALE: { label: "Vente", tone: "danger" },
  SALE_CANCELLATION: { label: "Vente annulée", tone: "success" },
  SALE_RETURN: { label: "Retour client", tone: "success" },
  PURCHASE_CANCELLATION: { label: "Achat annulé", tone: "danger" },
  ADJUSTMENT: { label: "Ajustement", tone: "warning" },
  INITIAL: { label: "Stock initial", tone: "neutral" },
  INVENTORY_ADJUSTMENT: { label: "Ajustement inventaire", tone: "warning" },
  LOSS: { label: "Perte / casse", tone: "danger" },
  LOSS_CANCELLATION: { label: "Perte annulée", tone: "success" },
};

/** Statut d'une déclaration de perte. */
export const LOSS_STATUS: Record<string, { label: string; tone: "danger" | "neutral" }> = {
  ACTIVE: { label: "Active", tone: "danger" },
  CANCELLED: { label: "Annulée", tone: "neutral" },
};

/** Libellé et couleur d'un niveau de stock. */
export const STOCK_LEVEL: Record<"OUT" | "LOW" | "NORMAL", { label: string; tone: "danger" | "warning" | "success" }> = {
  OUT: { label: "Rupture", tone: "danger" },
  LOW: { label: "Stock faible", tone: "warning" },
  NORMAL: { label: "Normal", tone: "success" },
};
