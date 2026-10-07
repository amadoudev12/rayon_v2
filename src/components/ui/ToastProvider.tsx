import { createContext, useCallback, useContext, useState } from "react";
import { Icon } from "./Icon";

type Toast = { id: number; message: string; tone: "success" | "error" | "info" };
type ToastContextValue = { push: (message: string, tone?: Toast["tone"]) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_STYLES = {
  success: { icon: "checkCircle", color: "text-emerald-600" },
  error: { icon: "alertCircle", color: "text-red-600" },
  info: { icon: "info", color: "text-brand-600" },
} as const;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message: string, tone: Toast["tone"] = "info") => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, message, tone }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-100 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            className="pointer-events-auto flex w-full animate-toast-in items-start gap-3 rounded-xl border border-slate-200/80 bg-white py-3 pl-3.5 pr-2 text-sm shadow-popover sm:w-auto sm:max-w-sm"
          >
            <Icon name={TONE_STYLES[toast.tone].icon} className={`mt-px h-4 w-4 shrink-0 ${TONE_STYLES[toast.tone].color}`} />
            <p className="flex-1 font-medium text-slate-800">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Fermer la notification"
              className="-my-0.5 rounded-md p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <Icon name="x" className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast doit être utilisé dans un ToastProvider");
  return context;
}
