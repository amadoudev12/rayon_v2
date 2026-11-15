import { useState } from "react";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { FormField, inputClass } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/ToastProvider";
import { sendJson } from "@/lib/mutation";

export type ResetTarget = { id: number; name: string };

/**
 * Réinitialisation du mot de passe d'un employé : ses appareils sont
 * déconnectés et il devra choisir un mot de passe personnel à sa prochaine
 * connexion. Aucun message n'est envoyé automatiquement.
 */
export function ResetPasswordModal({ member, onClose }: { member: ResetTarget | null; onClose: () => void }) {
  const { push } = useToast();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!member) return null;
  const problem = password.length === 0 ? null : password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password) ? "8 caractères au moins, dont une lettre et un chiffre." : null;

  function close() {
    setPassword("");
    setError(null);
    onClose();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!member || problem || !password) return;
    setSubmitting(true);
    const result = await sendJson(`/api/members/${member.id}/reset-password`, { motDePasseTemporaire: password });
    setSubmitting(false);
    if (!result.ok) return setError(result.message);
    push(`Mot de passe de ${member.name} réinitialisé. Communiquez-lui le mot de passe temporaire.`, "success");
    close();
  }

  return (
    <Modal open onClose={close} title={`Réinitialiser le mot de passe de ${member.name}`} size="sm">
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <Alert tone="warning">
          Ses appareils seront déconnectés. À sa prochaine connexion, il devra remplacer ce mot de passe temporaire par un mot de passe personnel.
        </Alert>
        <FormField label="Mot de passe temporaire" htmlFor="tempPassword" error={problem ?? undefined}>
          <input id="tempPassword" type="text" autoComplete="off" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} autoFocus />
        </FormField>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={close} disabled={submitting}>
            Annuler
          </Button>
          <Button type="submit" loading={submitting} disabled={!password || Boolean(problem)}>
            Réinitialiser
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
