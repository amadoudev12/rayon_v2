export function FormField({
  label,
  htmlFor,
  error,
  children,
  hint,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-slate-700">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600" role="alert">
          <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M12 22a10 10 0 100-20 10 10 0 000 20zM12 8v4M12 16h.01" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

const FIELD_BASE =
  "w-full rounded-lg border border-slate-200 bg-white text-sm text-slate-900 shadow-xs transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

/** Champ texte, nombre, textarea. */
export const inputClass = `${FIELD_BASE} px-3 py-[7px]`;

/** Liste déroulante : réserve la place du chevron défini dans globals.css. */
export const selectClass = `${FIELD_BASE} h-9 cursor-pointer py-0 pl-3 pr-9`;
