import { cn } from "../../lib/utils";

export type EntityTab = { id: string; label: string; soon?: boolean };

export function EntityTabs({ tabs, active, onChange }: { tabs: EntityTab[]; active: string; onChange: (id: string) => void }) {
  return <div className="scrollbar-subtle flex overflow-x-auto border-b" role="tablist">{tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={active === tab.id} onClick={() => onChange(tab.id)} className={cn("relative shrink-0 px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground", active === tab.id && "text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-accent")}>{tab.label}{tab.soon && <span className="ml-2 text-[10px] font-normal text-muted-foreground">Em breve</span>}</button>)}</div>;
}
