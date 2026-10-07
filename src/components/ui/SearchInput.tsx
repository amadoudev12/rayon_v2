import { useRouter, useSearchParams, usePathname } from "@/lib/navigation";
import { useRef, useState } from "react";
import { Icon } from "./Icon";

export function SearchInput({
  placeholder = "Rechercher…",
  paramName = "search",
}: {
  placeholder?: string;
  paramName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlValue = searchParams.get(paramName) ?? "";
  const [value, setValue] = useState(urlValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Garde le champ synchronisé quand l'URL change hors de ce champ (retour
  // arrière du navigateur, filtre réinitialisé ailleurs) — ajusté pendant le
  // rendu plutôt que dans un effet, selon les recommandations de React.
  const [trackedUrlValue, setTrackedUrlValue] = useState(urlValue);
  if (urlValue !== trackedUrlValue) {
    setTrackedUrlValue(urlValue);
    setValue(urlValue);
  }

  function handleChange(next: string) {
    setValue(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (next) params.set(paramName, next);
      else params.delete(paramName);
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    }, 350);
  }

  return (
    <div className="relative w-full sm:max-w-xs">
      <Icon
        name="search"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm text-slate-900 shadow-xs transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
      />
      {value && (
        <button
          type="button"
          onClick={() => handleChange("")}
          aria-label="Effacer la recherche"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <Icon name="x" className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
