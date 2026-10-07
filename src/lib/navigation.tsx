import { useMemo, type AnchorHTMLAttributes, type Ref } from "react";
import {
  Link as RouterLink,
  useLocation,
  useNavigate,
  useRevalidator,
  useSearchParams as useRouterSearchParams,
} from "react-router";

/**
 * Navigation du site, bâtie sur React Router.
 *
 * Les composants ont été écrits pour un `Link` qui prend `href` et pour un
 * routeur offrant `push`, `replace` et `refresh` : ce module leur fournit
 * exactement cette forme, pour qu'ils restent inchangés.
 */

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; ref?: Ref<HTMLAnchorElement> };

/** Lien interne : navigation sans rechargement de la page. */
export function Link({ href, ...props }: LinkProps) {
  return <RouterLink to={href} {...props} />;
}

export function useRouter() {
  const navigate = useNavigate();
  const revalidator = useRevalidator();

  return useMemo(
    () => ({
      push: (href: string) => void navigate(href),
      replace: (href: string) => void navigate(href, { replace: true }),
      /** Recharge les données de la page affichée (après un ajout, une modification…). */
      refresh: () => void revalidator.revalidate(),
    }),
    [navigate, revalidator],
  );
}

export function usePathname(): string {
  return useLocation().pathname;
}

export function useSearchParams(): URLSearchParams {
  return useRouterSearchParams()[0];
}

/** Paramètres de recherche de l'URL sous forme d'objet (attendu par `Pagination` et `PeriodFilter`). */
export function useSearchParamsRecord(): Record<string, string> {
  const searchParams = useSearchParams();
  return useMemo(() => Object.fromEntries(searchParams), [searchParams]);
}
