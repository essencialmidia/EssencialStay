import { NavLink } from "react-router-dom";
import { navigationSections, supportItem } from "../../lib/navigation";
import { cn } from "../../lib/utils";
import { Badge } from "../ui/badge";
import { Tooltip } from "../ui/tooltip";
import { BrandMark } from "./brand-mark";

type SidebarProps = {
  collapsed?: boolean;
  onNavigate?: () => void;
};

export function Sidebar({ collapsed = false, onNavigate }: SidebarProps) {
  return (
    <aside className="flex h-full flex-col border-r border-white/[0.08] bg-sidebar text-sidebar-foreground">
      <div className={cn("flex h-[72px] items-center border-b border-white/[0.08]", collapsed ? "justify-center px-2" : "px-5")}>
        <BrandMark compact={collapsed} inverted />
      </div>
      <nav className="scrollbar-subtle flex-1 overflow-y-auto px-3 py-4" aria-label="Navegação principal">
        {navigationSections.map((section, sectionIndex) => (
          <div key={section.label} className={cn(sectionIndex > 0 && "mt-5")}>
            {!collapsed && <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase text-sidebar-foreground/45">{section.label}</p>}
            {collapsed && sectionIndex > 0 && <div className="mx-auto mb-3 h-px w-7 bg-white/[0.08]" />}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const link = (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onNavigate}
                    className={({ isActive }) => cn(
                      "group/nav relative flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/65 transition duration-fast ease-product hover:bg-white/[0.06] hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      isActive && "bg-sidebar-active text-white shadow-xs before:absolute before:left-0 before:h-5 before:w-0.5 before:rounded-full before:bg-accent",
                      collapsed && "justify-center px-2",
                    )}
                  >
                    <item.icon className="size-[18px] shrink-0 transition-transform duration-fast group-hover/nav:scale-105" aria-hidden="true" />
                    {!collapsed && <span className="min-w-0 flex-1 truncate">{item.title}</span>}
                    {!collapsed && item.soon && <Badge className="border-white/10 bg-white/[0.06] text-[10px] text-sidebar-foreground/60" variant="outline">Breve</Badge>}
                  </NavLink>
                );
                return collapsed ? <Tooltip key={item.path} content={item.title}>{link}</Tooltip> : link;
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/[0.08] p-3">
        <NavLink
          to={supportItem.path}
          onClick={onNavigate}
          className={cn("flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/65 transition-colors hover:bg-white/[0.06] hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent", collapsed && "justify-center px-2")}
          title={collapsed ? supportItem.title : undefined}
        >
          <supportItem.icon className="size-[18px]" aria-hidden="true" />
          {!collapsed && <span>{supportItem.title}</span>}
        </NavLink>
      </div>
    </aside>
  );
}
