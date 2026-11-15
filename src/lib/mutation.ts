import { useCallback, useRef } from "react";
import { apiFetch } from "@/lib/api";

/**
 * Clé d'idempotence d'une opération sensible (vente, paiement, annulation,
 * retour, remboursement). La même clé est réutilisée tant que l'opération n'a
 * pas réussi : un nouvel essai après une coupure réseau ne crée jamais de
 * doublon côté serveur. `reset()` après un succès ou à la fermeture du formulaire.
 */
export function useIdempotencyKey() {
  const ref = useRef<string | null>(null);
  const get = useCallback(() => (ref.current ??= crypto.randomUUID()), []);
  const reset = useCallback(() => {
    ref.current = null;
  }, []);
  return { get, reset };
}

export type MutationResult<T> = { ok: true; data: T } | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

/** Envoie une écriture JSON et traduit l'échec en message affichable. */
export async function sendJson<T>(
  path: string,
  body: unknown,
  options: { method?: "POST" | "PUT" | "PATCH" | "DELETE"; idempotencyKey?: string } = {},
): Promise<MutationResult<T>> {
  let response: Response;
  try {
    response = await apiFetch(path, {
      method: options.method ?? "POST",
      headers: {
        "Content-Type": "application/json",
        ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
    return {
      ok: false,
      message: "Connexion au serveur impossible. Vérifiez votre réseau puis réessayez : l'opération ne sera pas enregistrée deux fois.",
    };
  }
  const payload = (await response.json().catch(() => null)) as
    | { data?: T; message?: string; errors?: { fieldErrors?: Record<string, string[]> } }
    | null;
  if (!response.ok) {
    return {
      ok: false,
      message: payload?.message ?? `Le serveur a répondu avec une erreur (${response.status}).`,
      fieldErrors: payload?.errors?.fieldErrors,
    };
  }
  return { ok: true, data: payload?.data as T };
}
