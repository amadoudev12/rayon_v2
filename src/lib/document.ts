import { useEffect } from "react";

/** Titre et description par défaut du site (ceux de `index.html`). */
const DEFAULT_TITLE = "Rayon";
const DEFAULT_DESCRIPTION = "Solution SaaS moderne de gestion commerciale pour petits commerçants";

function setDescription(content: string) {
  document.querySelector('meta[name="description"]')?.setAttribute("content", content);
}

/**
 * Titre de l'onglet (et description) propres à une page ou à un espace ;
 * ceux du site sont rétablis en la quittant.
 */
export function useDocumentTitle(title: string, description?: string) {
  useEffect(() => {
    document.title = title;
    if (description) setDescription(description);
    return () => {
      document.title = DEFAULT_TITLE;
      setDescription(DEFAULT_DESCRIPTION);
    };
  }, [title, description]);
}
