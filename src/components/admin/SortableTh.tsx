import { Link } from "@/lib/navigation";
import { usePathname, useSearchParams } from "@/lib/navigation";
import { Icon } from "@/components/ui/Icon";

/**
 * En-tête de colonne triable : un lien qui met à jour `sort`/`order` dans
 * l'URL (le tri est fait par le serveur). Premier clic : ordre par défaut de
 * la colonne ; clic suivant : ordre inverse.
 */
export function SortableTh({
  field,
  children,
  align = "left",
  defaultOrder = "desc",
  fallbackField,
}: {
  field: string;
  children: React.ReactNode;
  align?: "left" | "right";
  defaultOrder?: "asc" | "desc";
  /** Champ trié quand l'URL ne précise rien (tri par défaut de la page). */
  fallbackField: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentField = searchParams.get("sort") ?? fallbackField;
  const currentOrder = searchParams.get("order") === "asc" ? "asc" : "desc";
  const active = currentField === field;
  const nextOrder = active ? (currentOrder === "asc" ? "desc" : "asc") : defaultOrder;

  const params = new URLSearchParams(searchParams.toString());
  params.set("sort", field);
  params.set("order", nextOrder);
  params.delete("page");

  return (
    <th
      aria-sort={active ? (currentOrder === "asc" ? "ascending" : "descending") : undefined}
      className={`h-10 whitespace-nowrap px-5 font-medium ${align === "right" ? "text-right" : ""}`}
    >
      <Link
        href={`${pathname}?${params.toString()}`}
        className={`group inline-flex items-center gap-1 rounded transition-colors hover:text-slate-900 ${
          active ? "text-slate-900" : ""
        }`}
      >
        {children}
        <Icon
          name={active ? (currentOrder === "asc" ? "arrowUp" : "arrowDown") : "chevronsUpDown"}
          className={`h-3 w-3 ${active ? "text-brand-600" : "text-slate-300 group-hover:text-slate-400"}`}
        />
      </Link>
    </th>
  );
}
