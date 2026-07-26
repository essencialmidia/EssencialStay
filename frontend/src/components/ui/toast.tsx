import { createContext, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, TriangleAlert, X } from "lucide-react";
import { Button } from "./button";

type ToastContextValue = {
  showToast: (message: string, type?: "success" | "error") => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const value = useMemo(
    () => ({
      showToast: (nextMessage: string, type: "success" | "error" = "success") => {
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        setToast({ message: nextMessage, type });
        timeoutRef.current = window.setTimeout(() => setToast(null), 3600);
      },
    }),
    [],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div className="fixed bottom-4 left-4 right-4 z-[60] flex animate-slide-up items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm shadow-floating sm:left-auto sm:right-5 sm:max-w-sm" role="status" aria-live="polite">
          <div className={toast.type === "success" ? "grid size-8 shrink-0 place-items-center rounded-md bg-success/[0.12] text-success" : "grid size-8 shrink-0 place-items-center rounded-md bg-destructive/[0.12] text-destructive"}>
            {toast.type === "success" ? <CheckCircle2 className="size-4" aria-hidden="true" /> : <TriangleAlert className="size-4" aria-hidden="true" />}
          </div>
          <span className="min-w-0 flex-1 leading-5">{toast.message}</span>
          <Button variant="ghost" size="icon" className="size-8" onClick={() => setToast(null)} aria-label="Fechar notificacao">
            <X className="size-4" />
          </Button>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast deve ser usado dentro de ToastProvider");
  return context;
}
