import { Check } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { cn } from "../../lib/utils";

export type DropdownItem = string | {
  key?: string;
  label: string;
  onClick?: () => void;
  destructive?: boolean;
  icon?: ComponentType<{ className?: string }>;
  selected?: boolean;
  separatorBefore?: boolean;
  disabled?: boolean;
};

type DropdownMenuProps = {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
  triggerClassName?: string;
  contentClassName?: string;
  triggerAriaLabel?: string;
};

export function DropdownMenu({ trigger, items, align = "left", triggerClassName, contentClassName, triggerAriaLabel }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button type="button" className={cn("rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", triggerClassName)} onClick={() => setOpen((current) => !current)} aria-haspopup="menu" aria-expanded={open} aria-label={triggerAriaLabel}>
        {trigger}
      </button>
      {open && (
        <div role="menu" className={cn("absolute top-11 z-50 w-56 animate-scale-in rounded-lg border bg-card p-1.5 shadow-floating", align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left", contentClassName)}>
          {items.map((item) => {
            const label = typeof item === "string" ? item : item.label;
            const onClick = typeof item === "string" ? undefined : item.onClick;
            const destructive = typeof item === "string" ? false : item.destructive;
            const Icon = typeof item === "string" ? undefined : item.icon;
            const selected = typeof item === "string" ? false : item.selected;
            const separatorBefore = typeof item === "string" ? false : item.separatorBefore;
            const disabled = typeof item === "string" ? false : item.disabled;
            const key = typeof item === "string" ? item : item.key ?? item.label;
            return (
              <Fragment key={key}>
                {separatorBefore && <div className="my-1 border-t" role="separator" />}
                <button
                  type="button"
                  role="menuitem"
                  disabled={disabled}
                  onClick={() => {
                    onClick?.();
                    setOpen(false);
                  }}
                  className={cn("flex min-h-10 w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", selected && "bg-secondary font-medium", destructive && "text-destructive hover:bg-destructive/[0.08]")}
                >
                  {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  {selected && <Check className="size-4 shrink-0 text-success" />}
                </button>
              </Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
