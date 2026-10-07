import { Link } from "@/lib/navigation";

/** Routes d'authentification existantes, utilisées par tous les appels à l'action. */
export const LOGIN_HREF = "/login";
export const REGISTER_HREF = "/register";

/** Ancres des sections de la page d'accueil (navbar et footer). */
export const LANDING_LINKS = [
  { href: "#presentation", label: "Présentation" },
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#fonctionnement", label: "Comment ça marche" },
  { href: "#apercu", label: "Aperçu" },
  { href: "#avantages", label: "Avantages" },
] as const;

/** Logo de l'application : même pictogramme que l'icône du site et les écrans de connexion. */
export function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <Link
      href="/"
      aria-label="Rayon — accueil"
      className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 shadow-xs ring-1 ring-inset ring-white/10">
        <svg
          className="h-4 w-4 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9h18M9 20v-6h6v6" />
        </svg>
      </span>
      <span className={`text-[17px] font-semibold tracking-tight ${tone === "light" ? "text-white" : "text-slate-900"}`}>
        Rayon
      </span>
    </Link>
  );
}

const CTA_BASE =
  "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-px";

const CTA_VARIANTS = {
  primary:
    "bg-brand-600 text-white shadow-[0_1px_2px_rgb(15_23_42/0.08),0_8px_20px_-8px_rgb(79_70_229/0.55)] hover:bg-brand-700 focus-visible:ring-brand-500/60",
  secondary:
    "border border-slate-200 bg-white text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-slate-300",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-300",
  /** Sur fond sombre (section finale). */
  light: "bg-white text-slate-900 shadow-xs hover:bg-brand-50 focus-visible:ring-white/70 focus-visible:ring-offset-slate-900",
  outlineLight:
    "border border-white/20 text-white hover:border-white/40 hover:bg-white/10 focus-visible:ring-white/70 focus-visible:ring-offset-slate-900",
} as const;

const CTA_SIZES = {
  md: "h-9 px-3.5 text-sm",
  lg: "h-11 px-5 text-[15px]",
} as const;

/** Lien d'appel à l'action de la page d'accueil (mêmes codes visuels que `Button`). */
export function CtaLink({
  href,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  children,
}: {
  href: string;
  variant?: keyof typeof CTA_VARIANTS;
  size?: keyof typeof CTA_SIZES;
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} onClick={onClick} className={`${CTA_BASE} ${CTA_VARIANTS[variant]} ${CTA_SIZES[size]} ${className}`}>
      {children}
    </Link>
  );
}

/** En-tête de section : sur-titre, titre et texte d'introduction. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={`reveal max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`}>
      <p className="text-sm font-semibold text-brand-600">{eyebrow}</p>
      <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-pretty text-base leading-7 text-slate-600 sm:text-lg">{description}</p>}
    </div>
  );
}
