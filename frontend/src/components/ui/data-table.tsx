import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

type Column<T> = {
  key: keyof T;
  header: string;
  className?: string;
};

type DataTableProps<T extends Record<string, ReactNode>> = {
  columns: Column<T>[];
  rows: T[];
  rowKey?: (row: T, index: number) => string;
  className?: string;
};

export function DataTable<T extends Record<string, ReactNode>>({ columns, rows, rowKey, className }: DataTableProps<T>) {
  return (
    <div className={cn("scrollbar-subtle w-full overflow-x-auto rounded-lg border bg-card", className)}>
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
        <thead className="bg-surface text-xs text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)} className={cn("whitespace-nowrap px-4 py-3 font-medium", column.className)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={rowKey?.(row, index) ?? index} className="border-t transition-colors hover:bg-surface/65">
              {columns.map((column) => (
                <td key={String(column.key)} className={cn("px-4 py-3.5 align-middle", column.className)}>
                  {row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
