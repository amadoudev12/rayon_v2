const TONES = {
  neutral: { badge: "bg-slate-50 text-slate-700 ring-slate-200", dot: "bg-slate-400" },
  brand: { badge: "bg-brand-50 text-brand-700 ring-brand-200/70", dot: "bg-brand-500" },
  success: { badge: "bg-emerald-50 text-emerald-700 ring-emerald-200/70", dot: "bg-emerald-500" },
  warning: { badge: "bg-amber-50 text-amber-800 ring-amber-200/80", dot: "bg-amber-500" },
  danger: { badge: "bg-red-50 text-red-700 ring-red-200/70", dot: "bg-red-500" },
} as const;

export function Badge({
  tone = "neutral",
  dot = false,
  children,
}: {
  tone?: keyof typeof TONES;
  /** Affiche une pastille de couleur avant le texte (statuts). */
  dot?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone].badge}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${TONES[tone].dot}`} aria-hidden />}
      {children}
    </span>
  );
}
