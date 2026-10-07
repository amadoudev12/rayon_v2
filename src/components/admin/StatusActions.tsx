import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { apiFetch } from "@/lib/api";

type Target = {
  /** Route API à appeler en PATCH avec `{ actif }`. */
  endpoint: string;
  actif: boolean;
  confirmTitle: string;
  confirmDescription: string;
  confirmLabel: string;
  successMessage: string;
};

/** Bouton + confirmation + appel API, commun à la suspension d'une boutique et à la désactivation d'un compte. */
function StatusButton({ target, compact, labels }: { target: Target; compact: boolean; labels: { on: string; off: string } }) {
  const router = useRouter();
  const { push } = useToast();
  const [confirming, setConfirming] = useState(false);

  async function handleConfirm() {
    const response = await apiFetch(target.endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actif: !target.actif }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      push(body?.message ?? "Action impossible", "error");
      return;
    }
    push(target.successMessage, "success");
    router.refresh();
  }

  const label = target.actif ? labels.off : labels.on;

  return (
    // Les clics (y compris ceux de la fenêtre de confirmation, qui remontent
    // par l'arbre React malgré le portail) ne doivent pas déclencher le clic
    // de la ligne du tableau.
    <span className="contents" onClick={(event) => event.stopPropagation()}>
      {compact ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className={`rounded-md px-2 py-1 text-[13px] font-medium transition-colors ${
            target.actif ? "text-red-600 hover:bg-red-50" : "text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          {label}
        </button>
      ) : (
        <Button variant={target.actif ? "secondary" : "primary"} onClick={() => setConfirming(true)}>
          <Icon name={target.actif ? "ban" : "checkCircle"} className="h-4 w-4" />
          {label}
        </Button>
      )}

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={handleConfirm}
        title={target.confirmTitle}
        description={target.confirmDescription}
        confirmLabel={target.confirmLabel}
        danger={target.actif}
      />
    </span>
  );
}

export function OrganizationStatusButton({
  organization,
  compact = false,
}: {
  organization: { id: number; nom: string; actif: boolean };
  compact?: boolean;
}) {
  const { id, nom, actif } = organization;
  return (
    <StatusButton
      compact={compact}
      labels={{ on: "Réactiver", off: "Suspendre" }}
      target={{
        endpoint: `/api/admin/organizations/${id}`,
        actif,
        confirmTitle: actif ? `Suspendre « ${nom} » ?` : `Réactiver « ${nom} » ?`,
        confirmDescription: actif
          ? "Tous les membres de cette boutique perdront immédiatement l'accès à l'application. Aucune donnée n'est supprimée et la suspension est réversible."
          : "Les membres de cette boutique retrouveront immédiatement l'accès à l'application.",
        confirmLabel: actif ? "Suspendre la boutique" : "Réactiver la boutique",
        successMessage: actif ? "Boutique suspendue" : "Boutique réactivée",
      }}
    />
  );
}

export function UserStatusButton({
  user,
  compact = false,
}: {
  user: { id: number; prenom: string; nom: string; actif: boolean };
  compact?: boolean;
}) {
  const { id, prenom, nom, actif } = user;
  return (
    <StatusButton
      compact={compact}
      labels={{ on: "Réactiver", off: "Désactiver" }}
      target={{
        endpoint: `/api/admin/users/${id}`,
        actif,
        confirmTitle: actif ? `Désactiver le compte de ${prenom} ${nom} ?` : `Réactiver le compte de ${prenom} ${nom} ?`,
        confirmDescription: actif
          ? "Cette personne sera déconnectée et ne pourra plus se connecter. Son historique (ventes, achats…) est conservé."
          : "Cette personne pourra de nouveau se connecter.",
        confirmLabel: actif ? "Désactiver le compte" : "Réactiver le compte",
        successMessage: actif ? "Compte désactivé" : "Compte réactivé",
      }}
    />
  );
}
