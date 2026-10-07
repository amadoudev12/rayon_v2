import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { CtaLink, LANDING_LINKS, LOGIN_HREF, Logo, REGISTER_HREF } from "./parts";

export function LandingNav() {
  const [open, setOpen] = useState(false);

  // Échap ferme le menu mobile.
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav aria-label="Sections de la page" className="hidden items-center gap-1 lg:flex">
          {LANDING_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <CtaLink href={LOGIN_HREF} variant="ghost">
              Se connecter
            </CtaLink>
            <CtaLink href={REGISTER_HREF}>Créer un compte</CtaLink>
          </div>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            aria-controls="landing-mobile-menu"
            className="-mr-1.5 rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 lg:hidden"
          >
            <Icon name={open ? "x" : "menu"} className="h-5 w-5" />
          </button>
        </div>
      </div>

      {open && (
        <div id="landing-mobile-menu" className="animate-fade-in border-t border-slate-200/80 bg-white lg:hidden">
          <nav aria-label="Sections de la page" className="mx-auto flex max-w-6xl flex-col px-4 py-3 sm:px-6">
            {LANDING_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 grid grid-cols-1 gap-2 border-t border-slate-100 pt-4 sm:hidden">
              <CtaLink href={REGISTER_HREF} size="lg" onClick={() => setOpen(false)}>
                Créer un compte
              </CtaLink>
              <CtaLink href={LOGIN_HREF} size="lg" variant="secondary" onClick={() => setOpen(false)}>
                Se connecter
              </CtaLink>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
