import { API_URL } from "@/lib/api";
import { Icon } from "./Icon";

/**
 * Téléchargement d'un export CSV produit par le serveur (mêmes droits que
 * l'écran : la session du navigateur est jointe par le cookie).
 */
export function ExportLink({ path, label = "Exporter" }: { path: string; label?: string }) {
  return (
    <a
      href={`${API_URL}${path}`}
      download
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-xs transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
    >
      <Icon name="download" className="h-4 w-4" />
      {label}
    </a>
  );
}
