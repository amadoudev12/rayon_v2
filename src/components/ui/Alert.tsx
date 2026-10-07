import { Icon } from "./Icon";

const TONES = {
  error: { box: "border-red-200/80 bg-red-50 text-red-800", icon: "alertCircle", iconColor: "text-red-500" },
  warning: { box: "border-amber-200/80 bg-amber-50 text-amber-800", icon: "alert", iconColor: "text-amber-500" },
  info: { box: "border-brand-200/70 bg-brand-50 text-brand-800", icon: "info", iconColor: "text-brand-500" },
  success: { box: "border-emerald-200/80 bg-emerald-50 text-emerald-800", icon: "checkCircle", iconColor: "text-emerald-500" },
} as const;

/** Message contextuel dans une page ou un formulaire (erreur serveur, avertissement…). */
export function Alert({
  tone = "error",
  children,
  className = "",
}: {
  tone?: keyof typeof TONES;
  children: React.ReactNode;
  className?: string;
}) {
  const style = TONES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm ${style.box} ${className}`}
    >
      <Icon name={style.icon} className={`mt-px h-4 w-4 shrink-0 ${style.iconColor}`} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
