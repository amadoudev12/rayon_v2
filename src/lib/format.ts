export function formatMoney(amount: number, currency = "XOF") {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

export function formatDate(value: string | Date, options?: Intl.DateTimeFormatOptions) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("fr-FR", options ?? { dateStyle: "medium" }).format(date);
}

export function formatDateTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 86_400_000],
  ["month", 30 * 86_400_000],
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

/** « il y a 3 jours », « il y a 2 heures »… ; « à l'instant » sous la minute. */
export function formatRelative(value: string | Date, now: Date = new Date()) {
  const date = typeof value === "string" ? new Date(value) : value;
  const elapsed = date.getTime() - now.getTime();
  const formatter = new Intl.RelativeTimeFormat("fr-FR", { numeric: "always" });
  for (const [unit, duration] of RELATIVE_UNITS) {
    if (Math.abs(elapsed) >= duration) return formatter.format(Math.round(elapsed / duration), unit);
  }
  return "à l'instant";
}

/** « +12,5 % » / « -3 % » : variation signée, une décimale au plus. */
export function formatPercent(value: number, options: { signed?: boolean } = {}) {
  const sign = options.signed !== false && value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}
