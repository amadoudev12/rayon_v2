import { useEffect, useState } from "react";
import { useRouter } from "@/lib/navigation";
import { AuthShell } from "@/components/layout/AuthShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { FormField } from "@/components/ui/FormField";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { apiFetch } from "@/lib/api";
import { sendJson } from "@/lib/mutation";
import { formatDateTime } from "@/lib/format";

type ActiveSession = { id: string; audience: "web" | "mobile"; creeLe: string; derniereUtilisation: string; agentUtilisateur: string | null; courante: boolean };

/** Même règle que le serveur (lib/validations/auth). */
function passwordProblem(value: string): string | null {
  if (value.length < 8) return "8 caractères au moins.";
  if (!/[A-Za-z]/.test(value)) return "Au moins une lettre.";
  if (!/[0-9]/.test(value)) return "Au moins un chiffre.";
  return null;
}

/**
 * Changement de mot de passe : obligatoire après une réinitialisation par un
 * responsable (le serveur redirige ici), ou volontaire depuis le menu du
 * compte. Les autres appareils sont déconnectés par le serveur.
 */
export default function ChangePasswordPage() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sessions, setSessions] = useState<ActiveSession[] | null>(null);
  const [sessionsVersion, setSessionsVersion] = useState(0);
  const loadSessions = () => setSessionsVersion((value) => value + 1);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/account/sessions")
      .then(async (response) => {
        // Indisponible tant qu'un mot de passe temporaire n'a pas été remplacé.
        const data = response.ok ? ((await response.json()) as { data: ActiveSession[] }).data : null;
        if (!cancelled) setSessions(data);
      })
      .catch(() => !cancelled && setSessions(null));
    return () => {
      cancelled = true;
    };
  }, [sessionsVersion]);

  const nextProblem = next ? passwordProblem(next) : null;
  const mismatch = confirm && confirm !== next ? "Les deux mots de passe ne correspondent pas." : null;
  const canSubmit = current.length > 0 && next.length > 0 && !nextProblem && confirm === next;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const result = await sendJson<never>("/api/account/password", { motDePasseActuel: current, nouveauMotDePasse: next });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setCurrent("");
    setNext("");
    setConfirm("");
    setDone("Mot de passe modifié. Vos autres appareils ont été déconnectés.");
    loadSessions();
  }

  async function revokeOthers() {
    const result = await sendJson<{ sessionsFermees: number }>("/api/account/sessions/revoke-others", {});
    if (result.ok) {
      setDone(`${result.data.sessionsFermees} autre(s) appareil(s) déconnecté(s).`);
      loadSessions();
    } else setError(result.message);
  }

  return (
    <AuthShell title="Mot de passe" subtitle="Choisissez un mot de passe personnel que vous êtes seul à connaître.">
      <Card className="p-6 sm:p-7">
        <form onSubmit={submit} className="space-y-4">
          {error && <Alert>{error}</Alert>}
          {done && <Alert tone="success">{done}</Alert>}
          <FormField label="Mot de passe actuel (ou temporaire)" htmlFor="currentPassword">
            <PasswordInput id="currentPassword" autoComplete="current-password" value={current} onChange={(event) => setCurrent(event.target.value)} />
          </FormField>
          <FormField label="Nouveau mot de passe" htmlFor="newPassword" error={nextProblem ?? undefined} hint="8 caractères au moins, dont une lettre et un chiffre.">
            <PasswordInput id="newPassword" autoComplete="new-password" value={next} onChange={(event) => setNext(event.target.value)} />
          </FormField>
          <FormField label="Confirmer le nouveau mot de passe" htmlFor="confirmPassword" error={mismatch ?? undefined}>
            <PasswordInput id="confirmPassword" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} />
          </FormField>
          <Button type="submit" size="lg" className="w-full" loading={submitting} disabled={!canSubmit}>
            Enregistrer le nouveau mot de passe
          </Button>
          {done && (
            <Button type="button" variant="secondary" size="lg" className="w-full" onClick={() => router.push("/dashboard")}>
              Continuer vers l'application
            </Button>
          )}
        </form>
      </Card>

      {sessions && (
        <Card className="mt-4 p-6 sm:p-7">
          <h2 className="text-sm font-semibold text-slate-900">Appareils connectés</h2>
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {sessions.map((session) => (
              <li key={session.id} className="py-2">
                <span className="font-medium text-slate-800">{session.audience === "mobile" ? "Application mobile" : "Navigateur"}</span>
                {session.courante && <span className="ml-2 text-xs font-medium text-emerald-700">cet appareil</span>}
                <span className="block text-xs text-slate-500">
                  Ouverte le {formatDateTime(session.creeLe)} · dernière activité {formatDateTime(session.derniereUtilisation)}
                </span>
              </li>
            ))}
          </ul>
          {sessions.length > 1 && (
            <Button type="button" variant="secondary" className="mt-3 w-full" onClick={() => void revokeOthers()}>
              Déconnecter mes autres appareils
            </Button>
          )}
        </Card>
      )}
    </AuthShell>
  );
}
