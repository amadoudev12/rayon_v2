import { formatDate } from "@/lib/format";

export type SubscriptionAccess = {
  state: "UNMANAGED" | "TRIAL" | "ACTIVE" | "GRACE" | "READ_ONLY";
  canWrite: boolean;
  accessUntil: string | null;
  plan: string | null;
  /** Calculé par le serveur : fin de l'accès complet dans 5 jours ou moins. */
  endsSoon: boolean;
};

/**
 * Avertit de l'état de l'abonnement : fin d'essai proche, délai de grâce,
 * lecture seule. Rien n'est affiché pour une organisation non soumise ou à jour.
 */
export function SubscriptionBanner({ access }: { access?: SubscriptionAccess | null }) {
  if (!access || access.state === "UNMANAGED") return null;
  const until = access.accessUntil ? new Date(access.accessUntil) : null;

  if (access.state === "READ_ONLY") {
    return (
      <div role="alert" className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
        Votre abonnement n&apos;est plus actif : l&apos;application est en lecture seule. Vos données restent consultables et exportables. Contactez Rayon pour le renouveler.
      </div>
    );
  }
  if (access.state === "GRACE" || access.endsSoon) {
    return (
      <div role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
        {access.state === "TRIAL" ? "Votre période d'essai" : "Votre abonnement"} se termine
        {until ? ` le ${formatDate(until.toISOString())}` : " bientôt"}
        {access.state === "GRACE" ? " (délai de grâce)" : ""}. Pensez à le renouveler pour continuer à enregistrer vos ventes.
      </div>
    );
  }
  return null;
}
