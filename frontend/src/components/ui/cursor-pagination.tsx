import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

type CursorPaginationProps = {
  page: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export function CursorPagination({
  page,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}: CursorPaginationProps) {
  return (
    <div className="flex min-h-10 flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>Página {page}</span>
      <div className="flex items-center gap-2">
        <Button type="button" size="icon" variant="outline" className="size-9" disabled={!hasPrevious} onClick={onPrevious} title="Página anterior">
          <ChevronLeft className="size-4" />
        </Button>
        <Button type="button" size="icon" variant="outline" className="size-9" disabled={!hasNext} onClick={onNext} title="Próxima página">
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
