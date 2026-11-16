import { Link } from "@/lib/navigation";
import { PLATFORM_RANGES, type PlatformRange } from "@/lib/services/platform";

type SearchParams = Record<string, string | string[] | undefined>;

const SHORT_LABELS: Record<PlatformRange, string> = { today: "Aujourd'hui", "7d": "7 j", "30d": "30 j", "90d": "90 j" };

function buildHref(basePath: string, searchParams: SearchParams, changes: Record<string, string>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") params.set(key, value);
  }
  for (const [key, value] of Object.entries(changes)) params.set(key, value);
  return `${basePath}?${params.toString()}`;
}

const GROUP = "inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-xs";
const OPTION = "rounded-md px-2.5 py-1 text-[13px] font-medium transition-colors duration-150";
const OPTION_ACTIVE = "bg-slate-900 text-white";
const OPTION_IDLE = "text-slate-600 hover:bg-slate-100 hover:text-slate-900";

/**
 * Choix de la période. De simples liens : l'état vit dans l'URL, les
 * chiffres sont recalculés par le backend à chaque changement.
 */
export function PeriodFilter({ basePath, searchParams, range }: { basePath: string; searchParams: SearchParams; range: PlatformRange }) {
  return (
    <div className={GROUP} role="group" aria-label="Période">
      {PLATFORM_RANGES.map((option) => (
        <Link
          key={option}
          href={buildHref(basePath, searchParams, { range: option })}
          aria-current={option === range ? "true" : undefined}
          className={`${OPTION} ${option === range ? OPTION_ACTIVE : OPTION_IDLE}`}
        >
          {SHORT_LABELS[option]}
        </Link>
      ))}
    </div>
  );
}
