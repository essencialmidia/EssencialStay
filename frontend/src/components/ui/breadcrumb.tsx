import { ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

type BreadcrumbProps = {
  items: string[];
  className?: string;
};

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn("flex items-center gap-1 text-xs text-muted-foreground", className)} aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={item} className="inline-flex items-center gap-1">
          <span className={index === items.length - 1 ? "font-medium text-foreground" : undefined}>{item}</span>
          {index < items.length - 1 && <ChevronRight className="size-3.5 opacity-60" aria-hidden="true" />}
        </span>
      ))}
    </nav>
  );
}
