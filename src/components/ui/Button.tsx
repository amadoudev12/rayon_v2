import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import { Link } from "@/lib/navigation";

const BASE =
  "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-lg font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:translate-y-px disabled:pointer-events-none disabled:active:translate-y-0";

const VARIANTS = {
  primary:
    "bg-brand-600 text-white shadow-xs hover:bg-brand-700 focus-visible:ring-brand-500/60 disabled:bg-brand-300",
  secondary:
    "border border-slate-200 bg-white text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-slate-300 disabled:text-slate-400",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-300 disabled:text-slate-300",
  danger: "bg-red-600 text-white shadow-xs hover:bg-red-700 focus-visible:ring-red-500/60 disabled:bg-red-300",
} as const;

const SIZES = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-3.5 text-sm gap-2",
  lg: "h-10 px-4 text-sm gap-2",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  loading?: boolean;
};

export function Spinner({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
};

/** Même apparence que `Button`, mais rend un `<Link>` navigable au lieu d'un `<button>`. */
export function LinkButton({ href, variant = "primary", size = "md", className = "", children, ...props }: LinkButtonProps) {
  return (
    <Link href={href} className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`} {...props}>
      {children}
    </Link>
  );
}

/** Bouton carré ne contenant qu'une icône (actions de ligne, fermeture…). */
export function IconButton({
  label,
  tone = "default",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: "default" | "danger" }) {
  const toneClass =
    tone === "danger"
      ? "hover:bg-red-50 hover:text-red-600 focus-visible:ring-red-300"
      : "hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-slate-300";
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 ${toneClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
