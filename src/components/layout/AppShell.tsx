import { Link } from "@/lib/navigation";
import { usePathname, useRouter } from "@/lib/navigation";
import { signOut } from "@/lib/auth/client";
import { useEffect, useState } from "react";
import { NAV_ITEMS, NAV_SECTIONS, type NavItem } from "./navigation";
import { can } from "@/lib/auth/permissions";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Button";
import { initials } from "@/lib/format";
import { userContact } from "@/lib/auth/identifier";
import type { Role } from "@/generated/prisma/enums";
import { apiFetch } from "@/lib/api";

type Store = { id: number; nom: string };

export function AppShell({
  children,
  user,
  organization,
  role,
  stores,
  activeStoreId,
}: {
  children: React.ReactNode;
  user: { prenom: string; nom: string; email: string | null; telephone: string | null };
  organization: { nom: string; devise: string };
  role: Role;
  stores: Store[];
  /** Null quand le membre est limité à une seule boutique (pas de sélecteur). */
  activeStoreId: number | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [switchingStore, setSwitchingStore] = useState(false);

  const visibleNav = NAV_ITEMS.filter((item) => !item.permission || can(role, item.permission));
  const canCreateSale = can(role, "sale:create");

  // Échap ferme le menu mobile et le menu utilisateur.
  useEffect(() => {
    if (!mobileOpen && !userMenuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMobileOpen(false);
      setUserMenuOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, userMenuOpen]);

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.push("/login");
  }

  async function handleStoreChange(storeId: number) {
    setSwitchingStore(true);
    await apiFetch("/api/session/active-store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId }),
    });
    router.refresh();
    setSwitchingStore(false);
  }

  const currentPage = visibleNav.find((item) => pathname.startsWith(item.href));

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Barre latérale (ordinateur) */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-slate-200/80 bg-white lg:flex">
        <SidebarContent
          organization={organization}
          nav={visibleNav}
          pathname={pathname}
          showNewSale={canCreateSale}
        />
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
            <SidebarContent
              organization={organization}
              nav={visibleNav}
              pathname={pathname}
              showNewSale={canCreateSale}
              onNavigate={() => setMobileOpen(false)}
            />
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
              <span className="hidden truncate text-slate-500 sm:inline">{organization.nom}</span>
              <Icon name="chevronRight" className="hidden h-3.5 w-3.5 shrink-0 text-slate-300 sm:block" />
              <span className="truncate font-medium text-slate-900">{currentPage?.label ?? "Gestion de magasin"}</span>
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {activeStoreId !== null && stores.length > 1 && (
              <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  {switchingStore ? <Spinner className="h-3.5 w-3.5" /> : <Icon name="store" className="h-3.5 w-3.5" />}
                </span>
                <select
                  value={activeStoreId}
                  disabled={switchingStore}
                  onChange={(event) => handleStoreChange(Number(event.target.value))}
                  aria-label="Boutique active"
                  className="h-8 max-w-40 cursor-pointer truncate rounded-lg border border-slate-200 bg-white pl-8 pr-8 text-[13px] font-medium text-slate-700 shadow-xs transition-colors hover:border-slate-300 focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15 disabled:opacity-60 sm:max-w-56"
                >
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.nom}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-1.5 text-sm transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 sm:pr-2"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-[11px] font-semibold text-white">
                  {initials(user.prenom, user.nom)}
                </span>
                <span className="hidden font-medium text-slate-700 sm:inline">{user.prenom}</span>
                <Icon name="chevronDown" className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
              </button>

              {userMenuOpen && (
                <>
                  <button
                    aria-label="Fermer"
                    className="fixed inset-0 z-10 cursor-default"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div
                    role="menu"
                    className="absolute right-0 z-20 mt-2 w-64 origin-top-right animate-scale-in rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-popover"
                  >
                    <div className="flex items-center gap-3 px-2.5 py-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
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
                      <span className="inline-flex items-center rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-200/70">
                        {ROLE_LABELS[role]}
                      </span>
                    </div>
                    <div className="my-1 h-px bg-slate-100" />
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
  organization,
  nav,
  pathname,
  showNewSale,
  onNavigate,
}: {
  organization: { nom: string };
  nav: NavItem[];
  pathname: string;
  showNewSale: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-slate-100 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-semibold text-white shadow-xs ring-1 ring-inset ring-white/10">
          {organization.nom.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight text-slate-900">{organization.nom}</p>
          <p className="text-[11px] leading-tight text-slate-500">Gestion de magasin</p>
        </div>
      </div>

      {showNewSale && (
        <div className="px-3 pt-4">
          <Link
            href="/ventes/nouvelle"
            onClick={onNavigate}
            className="flex h-9 items-center justify-center gap-2 rounded-lg bg-brand-600 text-sm font-medium text-white shadow-xs transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2"
          >
            <Icon name="plus" className="h-4 w-4" />
            Nouvelle vente
          </Link>
        </div>
      )}

      <nav className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section) => {
          const items = nav.filter((item) => item.section === section);
          if (items.length === 0) return null;
          return (
            <div key={section}>
              <p className="mb-1 px-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">{section}</p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={`group flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-colors duration-150 ${
                        active
                          ? "bg-slate-100 text-slate-900"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
              </div>
            </div>
          );
        })}
      </nav>
    </>
  );
}
