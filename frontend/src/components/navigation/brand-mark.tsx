import { Building2 } from "lucide-react";
import { cn } from "../../lib/utils";

type BrandMarkProps = {
  compact?: boolean;
  className?: string;
  inverted?: boolean;
};

export function BrandMark({ compact = false, className, inverted = false }: BrandMarkProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <div className={cn("grid size-9 shrink-0 place-items-center rounded-md border shadow-xs", inverted ? "border-white/10 bg-white text-sidebar" : "bg-primary text-primary-foreground")}>
        <Building2 className="size-5" aria-hidden="true" />
      </div>
      {!compact && (
        <div className="min-w-0 leading-tight">
          <p className={cn("truncate text-sm font-semibold", inverted && "text-white")}>Essencial Stay</p>
          <p className={cn("truncate text-[11px]", inverted ? "text-sidebar-foreground/50" : "text-muted-foreground")}>Hospitalidade inteligente</p>
        </div>
      )}
    </div>
  );
}
