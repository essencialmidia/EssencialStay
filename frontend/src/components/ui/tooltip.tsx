import type { ReactNode } from "react";

type TooltipProps = {
  content: string;
  children: ReactNode;
  side?: "top" | "bottom";
};

export function Tooltip({ content, children, side = "bottom" }: TooltipProps) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 z-50 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5 text-xs text-background shadow-medium group-hover:block group-focus-within:block ${side === "top" ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]"}`}
      >
        {content}
      </span>
    </span>
  );
}
