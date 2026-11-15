import { Link } from "@/lib/navigation";

/** Bascule entre les éléments actifs et archivés d'une liste (`?archives=true`). */
export function ArchiveToggle({ basePath, showArchived }: { basePath: string; showArchived: boolean }) {
  return (
    <Link href={showArchived ? basePath : `${basePath}?archives=true`} className="whitespace-nowrap text-[13px] font-medium text-brand-700 hover:underline">
      {showArchived ? "← Retour aux actifs" : "Voir les archivés"}
    </Link>
  );
}
