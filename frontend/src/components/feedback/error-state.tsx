import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "../ui/button";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
};

export function ErrorState({ title = "Não foi possível carregar os dados", description = "Tente novamente em alguns instantes.", onRetry }: ErrorStateProps) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-4 rounded-lg border bg-card p-6 text-center shadow-xs">
      <div className="grid size-10 place-items-center rounded-md bg-destructive/[0.1] text-destructive">
        <TriangleAlert className="size-5" aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {onRetry && <Button variant="outline" size="sm" onClick={onRetry}><RotateCcw className="size-4" />Tentar novamente</Button>}
    </div>
  );
}
