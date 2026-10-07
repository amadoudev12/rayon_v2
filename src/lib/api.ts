import { redirect } from "react-router";

/**
 * Accès à l'API du backend.
 *
 * Par défaut le site appelle `/api/...` sur sa propre origine : en
 * développement, le serveur Vite transmet ces requêtes au backend (voir
 * `vite.config.ts`) ; en production, soit l'hébergeur fait de même, soit
 * `VITE_API_URL` donne l'adresse du backend.
 */
export const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

/**
 * `fetch` vers le backend. `credentials: "include"` joint le cookie de
 * session (HttpOnly, invisible du JavaScript) à chaque requête.
 */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_URL}${path}`, { credentials: "include", ...init });
}

/** Erreur de chargement d'une page, avec le code HTTP renvoyé par le backend. */
export class PageLoadError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Suit une redirection décidée par le backend. Les routes `/api/...` (ex :
 * fermeture d'une session devenue invalide) sont servies par le backend :
 * elles demandent un vrai changement de page, pas une navigation interne.
 */
export function followRedirect(destination: string): Response | Promise<never> {
  if (destination.startsWith("/api/")) {
    window.location.assign(`${API_URL}${destination}`);
    // La page va être remplacée : on ne rend rien entre-temps.
    return new Promise<never>(() => {});
  }
  return redirect(destination);
}

/**
 * Charge les données d'une page (`/api/pages/...`). Les paramètres de
 * recherche de l'adresse courante (page, recherche, filtres) sont transmis
 * tels quels : c'est le backend qui les interprète.
 *
 * - le backend demande une redirection (non connecté, onboarding, admin…) :
 *   elle est suivie ;
 * - page inconnue : réponse 404, affichée par la page « introuvable » ;
 * - autre échec : `PageLoadError`, affichée par l'écran d'erreur de l'espace.
 */
export async function loadPage<T>(path: string, request?: Request): Promise<T> {
  const search = request ? new URL(request.url).search : "";
  const response = await apiFetch(`/api/pages${path}${search}`, { signal: request?.signal });
  const body = (await response.json().catch(() => null)) as { data?: T; message?: string; redirect?: string } | null;

  if (body?.redirect) throw await followRedirect(body.redirect);
  if (response.status === 404) throw new Response(null, { status: 404, statusText: "Not Found" });
  if (!response.ok || !body) {
    throw new PageLoadError(response.status, body?.message ?? "Une erreur est survenue.");
  }
  return body.data as T;
}

type AccountState = { status: "anonymous" | "onboarding" | "superadmin" | "suspended" | "member"; home: string };

/**
 * Pour les pages publiques (accueil, connexion, inscription) : un visiteur
 * déjà connecté est envoyé directement vers son espace. Si le backend est
 * injoignable, la page publique s'affiche normalement.
 */
export async function redirectIfSignedIn(request: Request): Promise<null> {
  let account: AccountState | null = null;
  try {
    const response = await apiFetch("/api/auth/session", { signal: request.signal });
    if (response.ok) account = ((await response.json()) as { data: AccountState }).data;
  } catch {
    return null;
  }
  if (account && account.status !== "anonymous") throw redirect(account.home);
  return null;
}
