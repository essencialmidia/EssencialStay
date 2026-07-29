import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

type FormFieldProps = {
  label: ReactNode;
  children: ReactNode;
  description?: string;
  error?: string;
  optional?: boolean;
  className?: string;
};

export function FormField({ label, children, description, error, optional, className }: FormFieldProps) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="flex items-center justify-between gap-3 text-sm font-medium">
        {label}
        {optional && <span className="text-xs font-normal text-muted-foreground">Opcional</span>}
      </span>
      {children}
      {error ? (
        <span className="block text-xs text-destructive">{error}</span>
      ) : description ? (
        <span className="block text-xs leading-5 text-muted-foreground">{description}</span>
      ) : null}
    </label>
  );
}
