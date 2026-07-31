import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Button } from "./button";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  size?: "default" | "medium" | "large";
};

export function Modal({ open, title, description, children, onClose, size = "default" }: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const focusableSelector = "button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";
    dialog?.querySelector<HTMLElement>("[autofocus]")?.focus();
    if (!dialog?.contains(document.activeElement)) dialog?.querySelector<HTMLElement>(focusableSelector)?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onCloseRef.current(); return; }
      if (event.key !== "Tab" || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector)).filter((element) => !element.hidden && element.tabIndex !== -1);
      if (focusable.length === 0) { event.preventDefault(); dialog.focus(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid min-w-0 place-items-center p-3 sm:p-4">
      <button type="button" tabIndex={-1} className="absolute inset-0 animate-fade-in bg-foreground/25 backdrop-blur-[2px] dark:bg-black/60" aria-hidden="true" onClick={onClose} />
      <div ref={dialogRef} tabIndex={-1} className={cn("relative max-h-[calc(100dvh-1.5rem)] min-w-0 w-full animate-scale-in overflow-y-auto overscroll-contain rounded-lg border bg-card shadow-floating sm:max-h-[calc(100dvh-2rem)]", size === "large" ? "max-w-2xl" : size === "medium" ? "max-w-[540px]" : "max-w-lg")} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-card/95 px-5 py-4 backdrop-blur sm:px-6">
          <div>
            <h2 id={titleId} className="text-base font-semibold">{title}</h2>
            {description && <p id={descriptionId} className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>}
          </div>
          <Button variant="ghost" size="icon" className="-mr-2 -mt-1" onClick={onClose} aria-label="Fechar modal">
            <X className="size-4" />
          </Button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
