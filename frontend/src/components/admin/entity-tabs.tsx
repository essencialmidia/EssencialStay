import { cn } from "../../lib/utils";

export type EntityTab = { id: string; label: string; soon?: boolean };

export function EntityTabs({ tabs, active, onChange }: { tabs: EntityTab[]; active: string; onChange: (id: string) => void }) {
  return <div className="relative min-w-0 max-w-full overflow-hidden border-b after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-8 after:bg-gradient-to-l after:from-card after:to-transparent sm:after:hidden"><div className="scrollbar-subtle flex max-w-full overflow-x-auto overscroll-x-contain pr-6 sm:pr-0" role="tablist" aria-label="Seções da empresa">{tabs.map((tab) => <button key={tab.id} id={`tab-${tab.id}`} type="button" role="tab" aria-selected={active === tab.id} onClick={() => onChange(tab.id)} className={cn("relative min-h-11 shrink-0 px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring", active === tab.id && "text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-accent")}>{tab.label}{tab.soon && <span className="ml-2 text-[10px] font-normal text-muted-foreground">Em breve</span>}</button>)}</div></div>;
}
