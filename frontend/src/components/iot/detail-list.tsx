import type { ReactNode } from "react";

export function DetailList({ items }: { items: Array<{ label: string; value: ReactNode }> }) {
  return <dl className="grid gap-5 sm:grid-cols-2">{items.map((item) => <div key={item.label}><dt className="text-xs font-medium text-muted-foreground">{item.label}</dt><dd className="mt-1.5 break-words text-sm font-medium">{item.value}</dd></div>)}</dl>;
}
