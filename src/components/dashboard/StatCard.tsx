import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

const VALUE_TONES = {
  default: "text-slate-900",
  success: "text-emerald-600",
  danger: "text-red-600",
  warning: "text-amber-600",
} as const;

export function StatCard({
  label,
  value,
  tone = "default",
  icon,
  hint,
}: {
  label: string;
  value: string;
  tone?: keyof typeof VALUE_TONES;
  /** Nom d'une icône du jeu d'icônes, ou élément personnalisé. */
  icon?: React.ReactNode;
  /** Ligne d'explication sous la valeur (comparaison, détail du calcul…). */
  hint?: React.ReactNode;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-slate-500">{label}</p>
        {icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200/70">
            {typeof icon === "string" ? <Icon name={icon} className="h-4 w-4" /> : icon}
          </span>
        )}
      </div>
      <p className={`tabular mt-1 text-xl font-semibold tracking-tight sm:text-2xl ${VALUE_TONES[tone]}`}>{value}</p>
      {hint && <div className="mt-1.5 text-xs text-slate-500">{hint}</div>}
    </Card>
  );
}
