import { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "muted" | "outline" | "highlight" | "info";

const variants: Record<BadgeVariant, string> = {
  default: "bg-primary text-primary-foreground",
  success: "bg-success/[0.12] text-success ring-1 ring-inset ring-success/20 dark:text-success",
  warning: "bg-warning/[0.14] text-warning-foreground ring-1 ring-inset ring-warning/25 dark:text-warning",
  muted: "bg-muted text-muted-foreground",
  outline: "border bg-background text-muted-foreground",
  highlight: "bg-highlight/[0.14] text-highlight-foreground ring-1 ring-inset ring-highlight/25 dark:text-highlight",
  info: "bg-info/[0.12] text-info ring-1 ring-inset ring-info/20",
};

export function Badge({ className, variant = "default", ...props }: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn("inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-md px-2 text-xs font-medium", variants[variant], className)}
      {...props}
    />
  );
}
