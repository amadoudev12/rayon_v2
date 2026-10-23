import { formatMoney } from "@/lib/format";

/**
 * Données d'exemple de la démonstration : celles de la boutique de
 * démonstration (`prisma/seed.ts` du backend), comme les aperçus de la page
 * d'accueil. Elles ne servent qu'à la démonstration, jamais à l'application.
 */

export const money = (amount: number) => formatMoney(Math.round(amount), "XOF");

export const PRODUCTS = [
  { name: "Riz parfumé 5kg", price: 4250, stock: 40, unit: "sac", threshold: 5 },
  { name: "Huile végétale 1L", price: 1400, stock: 60, unit: "bouteille", threshold: 5 },
  { name: "Sucre en poudre 1kg", price: 800, stock: 8, unit: "kg", threshold: 5 },
  { name: "Eau minérale 1.5L", price: 400, stock: 120, unit: "bouteille", threshold: 5 },
  { name: "Jus de bissap 33cl", price: 500, stock: 3, unit: "bouteille", threshold: 5 },
  { name: "Dentifrice 100ml", price: 1000, stock: 0, unit: "pièce", threshold: 5 },
];

export const LOW_STOCK = PRODUCTS.filter((product) => product.stock <= product.threshold).sort((a, b) => a.stock - b.stock);

export const REVENUE = 486_500;
export const GROSS_MARGIN = 112_300;
export const EXPENSES = 45_000;
export const NET_PROFIT = GROSS_MARGIN - EXPENSES;

export const TREND = [
  { day: "lun.", value: 52_000 },
  { day: "mar.", value: 61_500 },
  { day: "mer.", value: 48_250 },
  { day: "jeu.", value: 70_500 },
  { day: "ven.", value: 66_000 },
  { day: "sam.", value: 84_750 },
  { day: "dim.", value: 38_750 },
];

export const TOP_PRODUCTS = [
  { name: "Eau minérale 1.5L", quantity: "210 bouteilles", amount: 84_000 },
  { name: "Riz parfumé 5kg", quantity: "38 sacs", amount: 161_500 },
];

/** Vente jouée dans la scène « Nouvelle vente » : index du produit et quantité finale. */
export const SALE_LINES = [
  { productIndex: 0, quantity: 2 },
  { productIndex: 1, quantity: 1 },
];

/** Modules de l'application, dans l'ordre du menu. */
export const FEATURES = [
  { icon: "grid", title: "Tableau de bord", text: "Chiffre d'affaires, marge, bénéfice" },
  { icon: "box", title: "Produits", text: "Catalogue, catégories et prix" },
  { icon: "layers", title: "Stock", text: "Quantités, alertes et mouvements" },
  { icon: "receipt", title: "Ventes", text: "Panier, remise et paiement" },
  { icon: "truck", title: "Achats", text: "Approvisionnements fournisseurs" },
  { icon: "users", title: "Clients et fournisseurs", text: "Carnet et coordonnées" },
  { icon: "wallet", title: "Dépenses", text: "Charges déduites du bénéfice" },
  { icon: "store", title: "Boutiques et équipe", text: "Un compte, un rôle par membre" },
];
