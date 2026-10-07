import { apiFetch } from "@/lib/api";

/**
 * Session du site, gérée par le backend : le jeton vit dans un cookie
 * `HttpOnly` que ce code ne peut ni lire ni modifier. Il se contente de
 * demander au backend d'ouvrir, de fermer ou de rafraîchir la session.
 */

type Credentials = { identifiant: string; motDePasse: string; redirect?: false };

/** Ouvre la session. `error` est renseigné si la connexion est refusée. */
export async function signIn(_provider: "credentials", credentials: Credentials): Promise<{ error: string | null }> {
  try {
    const response = await apiFetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifiant: credentials.identifiant, motDePasse: credentials.motDePasse }),
    });
    if (response.ok) return { error: null };
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    return { error: body?.message ?? "Connexion impossible." };
  } catch {
    return { error: "Connexion impossible." };
  }
}

/** Ferme la session (le backend efface le cookie). */
export async function signOut(_options?: { redirect?: false }): Promise<void> {
  await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
}

/** Demande au backend de réémettre la session avec l'organisation à jour (après l'onboarding). */
async function update(): Promise<void> {
  await apiFetch("/api/auth/session/refresh", { method: "POST" }).catch(() => undefined);
}

export function useSession() {
  return { update };
}
