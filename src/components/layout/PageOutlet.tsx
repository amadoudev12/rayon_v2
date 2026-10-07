import { Outlet, useLocation, useNavigation } from "react-router";

/**
 * Emplacement de la page dans un cadre (application ou administration).
 * Pendant le chargement des données d'une AUTRE page, affiche `fallback`
 * (squelette) à la place de l'ancienne ; un simple changement de recherche,
 * de filtre ou de numéro de page garde le contenu affiché jusqu'à l'arrivée
 * des nouvelles données.
 */
export function PageOutlet({ fallback }: { fallback: React.ReactNode }) {
  const navigation = useNavigation();
  const location = useLocation();
  const changingPage = navigation.state === "loading" && navigation.location.pathname !== location.pathname;

  return changingPage ? fallback : <Outlet />;
}
