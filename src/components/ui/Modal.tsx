import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    // Place le focus dans la fenêtre pour la navigation au clavier, sauf si
    // un champ l'a déjà (ex : autoFocus).
    if (!dialogRef.current?.contains(document.activeElement)) dialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const maxWidth = { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-2xl" }[size];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in cursor-default bg-slate-950/40 backdrop-blur-[2px]"
        tabIndex={-1}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className={`relative z-10 flex max-h-[92vh] w-full ${maxWidth} animate-scale-in flex-col rounded-t-2xl bg-white shadow-popover outline-none ring-1 ring-slate-900/5 sm:rounded-2xl`}
      >
        <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-5 sm:px-6">
          <div className="min-w-0">
            <h2 id="modal-title" className="text-base font-semibold tracking-tight text-slate-900">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fenêtre"
            className="-mr-1.5 -mt-1 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="scrollbar-thin overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Barre d'actions en bas d'un modal : séparée du contenu, boutons alignés à
 * droite (empilés en pleine largeur sur mobile).
 */
export function ModalFooter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`-mx-5 mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 px-5 pt-4 sm:-mx-6 sm:flex-row sm:justify-end sm:px-6 *:w-full sm:*:w-auto ${className}`}
    >
      {children}
    </div>
  );
}
