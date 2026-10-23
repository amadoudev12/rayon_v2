import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "@/lib/navigation";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/FormField";

export type PeriodKey = "today" | "yesterday" | "week" | "month" | "custom";

/** Période renvoyée par le backend (lib/period) : jours inclus au format AAAA-MM-JJ. */
export type SalesPeriod = { key: PeriodKey; from: string; to: string };

const OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Aujourd'hui" },
  { key: "yesterday", label: "Hier" },
  { key: "week", label: "Cette semaine" },
  { key: "month", label: "Ce mois" },
  { key: "custom", label: "Personnalisée" },
];

const GROUP = "inline-flex flex-wrap rounded-lg border border-slate-200 bg-white p-0.5 shadow-xs";
const OPTION = "rounded-md px-2.5 py-1 text-[13px] font-medium transition-colors duration-150";
const OPTION_ACTIVE = "bg-slate-900 text-white";
const OPTION_IDLE = "text-slate-600 hover:bg-slate-100 hover:text-slate-900";

/** « 23 oct. 2026 » ou « du 1 au 10 oct. 2026 » à partir des jours AAAA-MM-JJ. */
export function periodLabel(period: SalesPeriod) {
  const toDate = (key: string) => {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day);
  };
  const format = (key: string) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(toDate(key));
  return period.from === period.to ? format(period.from) : `du ${format(period.from)} au ${format(period.to)}`;
}

/**
 * Choix de la période des ventes et des statistiques. L'état vit dans l'URL
 * (`periode`, `du`, `au`) : le backend recalcule tout à chaque changement.
 */
export function PeriodSelector({ period }: { period: SalesPeriod }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [editingCustom, setEditingCustom] = useState(period.key === "custom");
  const [from, setFrom] = useState(period.from);
  const [to, setTo] = useState(period.to);

  function navigate(changes: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function select(key: PeriodKey) {
    if (key === "custom") {
      // Part de la période affichée, que l'on ajuste ensuite.
      setFrom(period.from);
      setTo(period.to);
      setEditingCustom(true);
      return;
    }
    setEditingCustom(false);
    navigate({ periode: key === "today" ? null : key, du: null, au: null });
  }

  const invalid = !from || !to || to < from;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className={GROUP} role="group" aria-label="Période">
        {OPTIONS.map((option) => {
          const active = editingCustom ? option.key === "custom" : option.key === period.key;
          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={active}
              onClick={() => select(option.key)}
              className={`${OPTION} ${active ? OPTION_ACTIVE : OPTION_IDLE}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {editingCustom && (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!invalid) navigate({ periode: "custom", du: from, au: to });
          }}
        >
          <label className="flex items-center gap-1.5 text-[13px] text-slate-600">
            Du
            <input type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} className={`${inputClass} h-8 w-auto py-1`} />
          </label>
          <label className="flex items-center gap-1.5 text-[13px] text-slate-600">
            au
            <input type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} className={`${inputClass} h-8 w-auto py-1`} />
          </label>
          <Button type="submit" size="sm" disabled={invalid}>
            Appliquer
          </Button>
        </form>
      )}
    </div>
  );
}
