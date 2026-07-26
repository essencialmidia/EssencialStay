import { Search } from "lucide-react";
import type { ReactNode } from "react";
import { Input } from "../ui/input";

export function EntityToolbar({ search, onSearchChange, searchPlaceholder, children }: { search: string; onSearchChange: (value: string) => void; searchPlaceholder: string; children?: ReactNode }) {
  return <div className="flex flex-col gap-3 rounded-md border bg-card p-3 sm:flex-row sm:items-center"><div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={search} placeholder={searchPlaceholder} onChange={(event) => onSearchChange(event.target.value)} /></div>{children && <div className="flex flex-wrap gap-2">{children}</div>}</div>;
}
