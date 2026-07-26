import { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Avatar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("grid size-9 place-items-center rounded-full border bg-surface-elevated text-xs font-semibold text-foreground shadow-xs", className)}
      {...props}
    />
  );
}
