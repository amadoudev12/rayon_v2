export type AdminNavItem = {
  href: string;
  label: string;
  icon: string;
  /** Groupe d'affichage dans la barre latérale. */
  section: (typeof ADMIN_NAV_SECTIONS)[number];
};

export const ADMIN_NAV_SECTIONS = ["Général", "Plateforme", "Analytics", "Compte"] as const;

/** Navigation de l'espace super administrateur : uniquement des pages qui existent. */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "Vue d'ensemble", icon: "grid", section: "Général" },
  { href: "/admin/boutiques", label: "Boutiques", icon: "store", section: "Plateforme" },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: "users", section: "Plateforme" },
  { href: "/admin/activite", label: "Activité", icon: "activity", section: "Plateforme" },
  { href: "/admin/statistiques", label: "Statistiques", icon: "chart", section: "Analytics" },
  { href: "/admin/profil", label: "Mon profil", icon: "user", section: "Compte" },
];

/** `/admin` n'est actif que sur la page d'accueil ; les autres le sont aussi sur leurs sous-pages. */
export function isAdminNavActive(href: string, pathname: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
