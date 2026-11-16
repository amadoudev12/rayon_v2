/**
 * Constantes et formes de données de l'espace super administrateur.
 *
 * Les calculs sont faits par le backend (`backend/src/services/platform.ts`
 * et `platform-admin.ts`) ; ce fichier ne garde que ce dont l'affichage a
 * besoin : libellés, listes de filtres et types des réponses.
 *
 * Confidentialité : le super administrateur ne reçoit AUCUNE donnée
 * commerciale des boutiques (ventes, chiffre d'affaires, produits, clients) ;
 * seulement les comptes, les statuts et la date de dernière activité.
 */

/** Sans activité depuis ce nombre de jours, une boutique est dite « inactive ». */
export const INACTIVITY_DAYS = 30;

export const PLATFORM_RANGES = ["today", "7d", "30d", "90d"] as const;
export type PlatformRange = (typeof PLATFORM_RANGES)[number];

export const RANGE_LABELS: Record<PlatformRange, string> = {
  today: "Aujourd'hui",
  "7d": "7 derniers jours",
  "30d": "30 derniers jours",
  "90d": "90 derniers jours",
};

export type OrganizationStatus = "active" | "inactive" | "suspended";

export type PlatformAlert = {
  key: "inactive" | "neverUsed" | "suspended" | "onboarding";
  tone: "warning" | "danger" | "neutral";
  count: number;
  title: string;
  description: string;
  href: string;
};

export const ACTIVITY_KINDS = ["organization", "user", "admin"] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export const ACTIVITY_KIND_LABELS: Record<ActivityKind, string> = {
  organization: "Boutiques créées",
  user: "Inscriptions",
  admin: "Actions d'administration",
};

export type ActivityEvent = {
  /** Identifiant stable, unique dans le flux. */
  id: string;
  kind: ActivityKind;
  icon: string;
  tone: "brand" | "success" | "danger" | "warning" | "neutral";
  title: string;
  subtitle: string;
  date: Date;
  organization: { id: number; name: string } | null;
};

/** Événement tel qu'il arrive en JSON : la date est une chaîne ISO. */
export type ActivityEventJson = Omit<ActivityEvent, "date"> & { date: string };

/** Rend aux événements reçus du backend leur vraie date. */
export function reviveEvents(events: ActivityEventJson[]): ActivityEvent[] {
  return events.map((event) => ({ ...event, date: new Date(event.date) }));
}

/** GET /api/pages/admin : comptes et activité de la plateforme (voir `getPlatformOverview`). */
export type PlatformOverview = {
  range: PlatformRange;
  period: { start: string; end: string };
  organizations: { total: number; suspended: number; active: number; inactive: number; created: number; previousCreated: number };
  users: { total: number; active: number; created: number; disabled: number };
  stores: number;
  /** Boutiques classées par dernière activité (date seulement). */
  recentlyActive: { id: number; name: string; actif: boolean; lastActivity: string | null; status: OrganizationStatus }[];
};

/** Répartition par ancienneté de la dernière activité. */
export type ActivityBuckets = { today: number; week: number; month: number; older: number; never: number };

/** GET /api/pages/admin/statistiques (voir `getPlatformAnalytics`). */
export type PlatformAnalytics = {
  signups: { week: string; organizations: number; users: number }[];
  organizationActivity: ActivityBuckets;
  userActivity: ActivityBuckets;
};
