import { Loader2 } from "lucide-react";

export function LoadingState({ label = "Carregando dados" }: { label?: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center gap-3 rounded-lg border bg-card text-sm text-muted-foreground shadow-xs" role="status">
      <Loader2 className="size-5 animate-spin text-accent" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
