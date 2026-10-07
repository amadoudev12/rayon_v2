/**
 * Cadre commun des écrans hors application (connexion, inscription,
 * onboarding) : logo, titre et contenu centrés sur un fond sobre.
 */
export function AuthShell({
  title,
  subtitle,
  width = "md",
  children,
}: {
  title: string;
  subtitle?: string;
  width?: "md" | "lg";
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-canvas px-4 py-12">
      {/* Trame très légère en arrière-plan, estompée vers les bords. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-size-[48px_48px] opacity-40 mask-[radial-gradient(ellipse_at_top,black_20%,transparent_65%)]"
      />
      <div className={`relative w-full animate-slide-up ${width === "lg" ? "max-w-xl" : "max-w-sm"}`}>
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 shadow-xs ring-1 ring-inset ring-white/10">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9h18M9 20v-6h6v6" />
            </svg>
          </div>
          <h1 className="mt-5 text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {children}
        <p className="mt-8 text-center text-xs text-slate-400">Gestion de magasin · Votre commerce, simplifié.</p>
      </div>
    </div>
  );
}
