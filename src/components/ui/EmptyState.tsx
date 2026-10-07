import { Icon, isIconName } from "./Icon";

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
}: {
  /** Nom d'une icône du jeu d'icônes (recommandé) ou élément personnalisé. */
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** Version resserrée, pour les petites cartes. */
  compact?: boolean;
}) {
  return (
    <div
      className={`flex animate-fade-in flex-col items-center justify-center text-center ${
        compact ? "gap-2 px-6 py-10" : "gap-3 px-6 py-16"
      }`}
    >
      {icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-xs">
          {isIconName(icon) ? <Icon name={icon} className="h-5 w-5" /> : icon}
        </div>
      )}
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {description && <p className="mx-auto mt-1 max-w-sm text-[13px] text-slate-500">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
