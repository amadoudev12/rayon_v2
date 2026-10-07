/**
 * Constantes et formes de données de l'espace super administrateur.
 *
 * Les calculs sont faits par le backend (`backend/src/lib/services/platform.ts`
 * et `platform-admin.ts`) ; ce fichier ne garde que ce dont l'affichage a
 * besoin : libellés, listes de filtres et types des réponses.
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

export type SeriesPoint = { day: string; value: number; count: number };

export type PlatformAlert = {
  key: "inactive" | "noSales" | "suspended" | "onboarding";
  tone: "warning" | "danger" | "neutral";
  count: number;
  title: string;
  description: string;
  href: string;
};

export const ACTIVITY_KINDS = ["organization", "user", "product", "sale", "admin"] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export const ACTIVITY_KIND_LABELS: Record<ActivityKind, string> = {
  organization: "Boutiques créées",
  user: "Inscriptions",
  product: "Produits ajoutés",
  sale: "Ventes",
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
  amount?: { value: number; currency: string; cancelled: boolean };
};

/** Événement tel qu'il arrive en JSON : la date est une chaîne ISO. */
export type ActivityEventJson = Omit<ActivityEvent, "date"> & { date: string };

/** Rend aux événements reçus du backend leur vraie date. */
export function reviveEvents(events: ActivityEventJson[]): ActivityEvent[] {
  return events.map((event) => ({ ...event, date: new Date(event.date) }));
}

/** GET /api/pages/admin : chiffres de la vue d'ensemble (voir `getPlatformOverview` côté backend). */
export type PlatformOverview = {
  range: PlatformRange;
  period: { start: string; end: string };
  /** Devise des montants affichés, et devises disponibles (une par devise d'organisation). */
  currency: string;
  currencies: string[];
  organizations: { total: number; suspended: number; active: number; inactive: number; created: number; previousCreated: number };
  users: { total: number; active: number; created: number; disabled: number };
  products: number;
  stores: number;
  revenue: {
    allTime: number;
    today: number;
    month: number;
    monthChange: number | null;
    period: number;
    periodChange: number | null;
    /** Nombre d'organisations qui facturent dans cette devise. */
    organizations: number;
  };
  /** Nombres de ventes terminées, toutes devises confondues. */
  sales: { allTime: number; today: number; period: number; periodChange: number | null };
  series: SeriesPoint[];
  topOrganizations: { id: number; name: string; currency: string; revenue: number; sales: number }[];
  topProducts: { id: number; name: string; unit: string; organization: string; currency: string; quantity: number; amount: number }[];
};

/** GET /api/pages/admin/statistiques (voir `getPlatformAnalytics` côté backend). */
export type PlatformAnalytics = {
  range: PlatformRange;
  period: { start: string; end: string };
  currency: string;
  currencies: string[];
  revenue: { period: number; periodChange: number | null; averageBasket: number };
  sales: { period: number; periodChange: number | null; cancelled: number; cancellationRate: number | null };
  series: SeriesPoint[];
  paymentMethods: { method: string; count: number; revenue: number }[];
  ranking: {
    id: number;
    name: string;
    currency: string;
    actif: boolean;
    revenue: number;
    sales: number;
    lastActivity: string | null;
    averageBasket: number;
    status: OrganizationStatus;
  }[];
  signups: { week: string; organizations: number; users: number }[];
};
