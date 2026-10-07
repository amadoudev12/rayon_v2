import { Link } from "@/lib/navigation";
import { Icon } from "./Icon";

type SearchParams = Record<string, string | string[] | undefined>;

function buildHref(basePath: string, searchParams: SearchParams, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "page" || value === undefined) continue;
    if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
    else params.set(key, value);
  }
  params.set("page", String(page));
  return `${basePath}?${params.toString()}`;
}

const PAGE_LINK =
  "inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] font-medium text-slate-700 shadow-xs transition-colors hover:border-slate-300 hover:bg-slate-50";
const PAGE_LINK_DISABLED = "pointer-events-none opacity-40 shadow-none";

export function Pagination({
  basePath,
  searchParams,
  page,
  totalPages,
  total,
}: {
  basePath: string;
  searchParams: SearchParams;
  page: number;
  totalPages: number;
  total: number;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-[13px] text-slate-500"
    >
      <p className="tabular">
        Page <span className="font-medium text-slate-900">{page}</span> sur{" "}
        <span className="font-medium text-slate-900">{totalPages}</span>
        <span className="hidden sm:inline">
          {" "}
          · {total} résultat{total > 1 ? "s" : ""}
        </span>
      </p>
      <div className="flex gap-2">
        <Link
          href={buildHref(basePath, searchParams, Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={`${PAGE_LINK} ${page <= 1 ? PAGE_LINK_DISABLED : ""}`}
        >
          <Icon name="chevronLeft" className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Précédent</span>
        </Link>
        <Link
          href={buildHref(basePath, searchParams, Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          className={`${PAGE_LINK} ${page >= totalPages ? PAGE_LINK_DISABLED : ""}`}
        >
          <span className="hidden sm:inline">Suivant</span>
          <Icon name="chevronRight" className="h-3.5 w-3.5" />
        </Link>
      </div>
    </nav>
  );
}
