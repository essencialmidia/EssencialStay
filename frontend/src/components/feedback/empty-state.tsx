import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Badge } from "../ui/badge";

type EmptyStateProps = {
  title: string;
  description: ReactNode;
  icon?: LucideIcon;
  label?: string;
  className?: string;
  action?: ReactNode;
  compact?: boolean;
};

export function EmptyState({ title, description, icon: Icon = Inbox, label, className, action, compact = false }: EmptyStateProps) {
  return (
    <div className={cn("relative flex flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed bg-surface/70 text-center", compact ? "min-h-40 p-6" : "min-h-64 px-6 py-10", className)}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className={cn("grid place-items-center rounded-lg border bg-card text-muted-foreground shadow-xs", compact ? "size-10" : "size-12")}>
        <Icon className={compact ? "size-5" : "size-6"} aria-hidden="true" />
      </div>
      <h2 className={cn("font-semibold", compact ? "mt-4 text-sm" : "mt-5 text-base")}>{title}</h2>
      <div className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</div>
      {action && <div className="mt-5">{action}</div>}
      {label && <Badge className="mt-4" variant="outline">{label}</Badge>}
    </div>
  );
}
