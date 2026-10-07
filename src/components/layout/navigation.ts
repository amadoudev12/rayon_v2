import type { Permission } from "@/lib/auth/permissions";

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  permission?: Permission;
  /** Groupe d'affichage dans la barre latérale. */
  section: "Général" | "Catalogue" | "Commerce" | "Gestion";
};

export const NAV_SECTIONS = ["Général", "Catalogue", "Commerce", "Gestion"] as const;

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: "grid", section: "Général" },
  { href: "/produits", label: "Produits", icon: "box", section: "Catalogue" },
  { href: "/stock", label: "Stock", icon: "layers", section: "Catalogue" },
  { href: "/ventes", label: "Ventes", icon: "cart", section: "Commerce" },
  { href: "/achats", label: "Achats", icon: "truck", permission: "purchase:manage", section: "Commerce" },
  { href: "/clients", label: "Clients", icon: "users", section: "Commerce" },
  { href: "/fournisseurs", label: "Fournisseurs", icon: "building", permission: "supplier:manage", section: "Commerce" },
  { href: "/depenses", label: "Dépenses", icon: "wallet", permission: "expense:manage", section: "Gestion" },
  { href: "/parametres", label: "Paramètres", icon: "settings", permission: "members:manage", section: "Gestion" },
];
