import { X } from "lucide-react";
import { useEffect, useId } from "react";
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

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined}>
      <button type="button" className="absolute inset-0 animate-fade-in bg-foreground/25 backdrop-blur-[2px] dark:bg-black/60" aria-label="Fechar modal" onClick={onClose} />
      <div className={cn("relative max-h-[calc(100vh-2rem)] w-full animate-scale-in overflow-y-auto rounded-lg border bg-card shadow-floating", size === "large" ? "max-w-2xl" : size === "medium" ? "max-w-[540px]" : "max-w-lg")}>
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
