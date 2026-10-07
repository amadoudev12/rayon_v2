import { Link } from "@/lib/navigation";
import { usePathname, useRouter } from "@/lib/navigation";
import { signOut } from "@/lib/auth/client";
import { useEffect, useState } from "react";
import { ADMIN_NAV_ITEMS, ADMIN_NAV_SECTIONS, isAdminNavActive } from "./admin-navigation";
import { Icon } from "@/components/ui/Icon";
import { initials } from "@/lib/format";
import { userContact } from "@/lib/auth/identifier";

/** Point d'attention affiché dans la cloche (calculé côté serveur). */
type ShellAlert = { key: string; tone: "warning" | "danger" | "neutral"; title: string; description: string; href: string };

const ALERT_DOT = { warning: "bg-amber-500", danger: "bg-red-500", neutral: "bg-slate-400" } as const;

/**
 * Cadre de l'espace super administrateur. Reprend volontairement la structure
 * et les styles de `AppShell` (même identité visuelle), avec sa propre
 * navigation : aucun lien vers l'espace commerçant, et inversement.
 */
export function AdminShell({
  children,
  user,
  alerts,
}: {
  children: React.ReactNode;
  user: { prenom: string; nom: string; email: string | null; telephone: string | null };
  alerts: ShellAlert[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<"user" | "alerts" | null>(null);

  // Échap ferme le menu mobile et les menus de l'en-tête.
  useEffect(() => {
    if (!mobileOpen && !openMenu) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMobileOpen(false);
      setOpenMenu(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, openMenu]);

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.push("/login");
  }

  const currentPage = ADMIN_NAV_ITEMS.find((item) => isAdminNavActive(item.href, pathname));

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Barre latérale (ordinateur) */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-slate-200/80 bg-white lg:flex">
        <SidebarContent pathname={pathname} onSignOut={handleSignOut} />
      </aside>

      {/* Barre latérale (mobile / tablette) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Fermer le menu"
            className="absolute inset-0 animate-fade-in bg-slate-950/40 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-72 max-w-[85vw] animate-slide-in-left flex-col bg-white shadow-popover">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Fermer le menu"
              className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <Icon name="x" className="h-4 w-4" />
            </button>
            <SidebarContent pathname={pathname} onSignOut={handleSignOut} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="-ml-1.5 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:hidden"
              aria-label="Ouvrir le menu"
            >
              <Icon name="menu" className="h-5 w-5" />
            </button>
            <nav aria-label="Fil d'Ariane" className="flex min-w-0 items-center gap-1.5 text-sm">
              <span className="hidden truncate text-slate-500 sm:inline">Administration</span>
              <Icon name="chevronRight" className="hidden h-3.5 w-3.5 shrink-0 text-slate-300 sm:block" />
              <span className="truncate font-medium text-slate-900">{currentPage?.label ?? "Plateforme"}</span>
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {/* Notifications : points nécessitant l'attention du super administrateur. */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenMenu((menu) => (menu === "alerts" ? null : "alerts"))}
                aria-haspopup="menu"
                aria-expanded={openMenu === "alerts"}
                aria-label={alerts.length > 0 ? `Notifications (${alerts.length})` : "Notifications"}
                className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              >
                <Icon name="bell" className="h-4.5 w-4.5" />
                {alerts.length > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" aria-hidden />
                )}
              </button>

              {openMenu === "alerts" && (
                <>
                  <button aria-label="Fermer" className="fixed inset-0 z-10 cursor-default" onClick={() => setOpenMenu(null)} />
                  <div
                    role="menu"
                    className="absolute right-0 z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] origin-top-right animate-scale-in rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-popover"
                  >
                    <p className="px-2.5 pb-1.5 pt-2 text-xs font-medium uppercase tracking-wider text-slate-400">À surveiller</p>
                    {alerts.length === 0 ? (
                      <p className="flex items-center gap-2 px-2.5 pb-3 pt-1 text-sm text-slate-500">
                        <Icon name="checkCircle" className="h-4 w-4 text-emerald-500" />
                        Rien à signaler pour le moment.
                      </p>
                    ) : (
                      alerts.map((alert) => (
                        <Link
                          key={alert.key}
                          href={alert.href}
                          role="menuitem"
                          onClick={() => setOpenMenu(null)}
                          className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-slate-50"
                        >
                          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${ALERT_DOT[alert.tone]}`} aria-hidden />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-slate-900">{alert.title}</span>
                            <span className="block text-xs text-slate-500">{alert.description}</span>
                          </span>
                        </Link>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenMenu((menu) => (menu === "user" ? null : "user"))}
                aria-haspopup="menu"
                aria-expanded={openMenu === "user"}
                className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-1.5 text-sm transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 sm:pr-2"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
                  {initials(user.prenom, user.nom)}
                </span>
                <span className="hidden font-medium text-slate-700 sm:inline">{user.prenom}</span>
                <Icon name="chevronDown" className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
              </button>

              {openMenu === "user" && (
                <>
                  <button aria-label="Fermer" className="fixed inset-0 z-10 cursor-default" onClick={() => setOpenMenu(null)} />
                  <div
                    role="menu"
                    className="absolute right-0 z-20 mt-2 w-64 origin-top-right animate-scale-in rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-popover"
                  >
                    <div className="flex items-center gap-3 px-2.5 py-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                        {initials(user.prenom, user.nom)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {user.prenom} {user.nom}
                        </p>
                        <p className="truncate text-xs text-slate-500">{userContact(user)}</p>
                      </div>
                    </div>
                    <div className="px-2.5 pb-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-200/70">
                        <Icon name="shield" className="h-3 w-3" />
                        Super administrateur
                      </span>
                    </div>
                    <div className="my-1 h-px bg-slate-100" />
                    <Link
                      href="/admin/profil"
                      role="menuitem"
                      onClick={() => setOpenMenu(null)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                    >
                      <Icon name="user" className="h-4 w-4 text-slate-400" />
                      Mon profil
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                    >
                      <Icon name="logout" className="h-4 w-4 text-slate-400" />
                      Déconnexion
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 animate-slide-up px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  pathname,
  onSignOut,
  onNavigate,
}: {
  pathname: string;
  onSignOut: () => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-slate-100 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs ring-1 ring-inset ring-white/10">
          <Icon name="shield" className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight text-slate-900">Gestion de magasin</p>
          <p className="text-[11px] leading-tight text-slate-500">Administration de la plateforme</p>
        </div>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {ADMIN_NAV_SECTIONS.map((section) => (
          <div key={section}>
            <p className="mb-1 px-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">{section}</p>
            <div className="space-y-0.5">
              {ADMIN_NAV_ITEMS.filter((item) => item.section === section).map((item) => {
                const active = isAdminNavActive(item.href, pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`group flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-colors duration-150 ${
                      active ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon
                      name={item.icon}
                      className={`h-4 w-4 transition-colors ${
                        active ? "text-brand-600" : "text-slate-400 group-hover:text-slate-500"
                      }`}
                    />
                    {item.label}
                  </Link>
                );
              })}
              {section === "Compte" && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="group flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-50 hover:text-slate-900"
                >
                  <Icon name="logout" className="h-4 w-4 text-slate-400 transition-colors group-hover:text-slate-500" />
                  Déconnexion
                </button>
              )}
            </div>
          </div>
        ))}
      </nav>
    </>
  );
}
