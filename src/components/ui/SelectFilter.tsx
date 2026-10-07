import { useRouter, usePathname, useSearchParams } from "@/lib/navigation";

export function SelectFilter({
  paramName,
  options,
  placeholder = "Tous",
}: {
  paramName: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = searchParams.get(paramName) ?? "";

  function handleChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set(paramName, next);
    else params.delete(paramName);
    params.delete("page");
    params.delete("before");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={value}
      onChange={(event) => handleChange(event.target.value)}
      aria-label={placeholder}
      className={`h-9 w-full cursor-pointer rounded-lg border bg-white pl-3 pr-9 text-sm shadow-xs transition-[border-color,box-shadow] duration-150 focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15 sm:w-auto ${
        value
          ? "border-brand-300 font-medium text-brand-700"
          : "border-slate-200 text-slate-700 hover:border-slate-300"
      }`}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
