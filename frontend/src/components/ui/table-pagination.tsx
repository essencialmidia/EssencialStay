import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

export function TablePagination({ page, pageSize, total, onPageChange }: { page: number; pageSize: number; total: number; onPageChange: (page: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex min-h-10 flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>{start}-{end} de {total}</span>
      <div className="flex items-center gap-2">
        <Button type="button" size="icon" variant="outline" className="size-9" disabled={page <= 1} onClick={() => onPageChange(page - 1)} title="Página anterior">
          <ChevronLeft className="size-4" />
        </Button>
        <span className="min-w-20 text-center tabular-nums">{page} de {totalPages}</span>
        <Button type="button" size="icon" variant="outline" className="size-9" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} title="Próxima página">
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
