import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { getNavigationItem } from "../../lib/navigation";
import { cn } from "../../lib/utils";
import { Sidebar } from "../navigation/sidebar";
import { Topbar } from "./topbar";

export function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const currentItem = getNavigationItem(location.pathname);

  return (
    <div className="min-h-screen bg-background">
      <div className={cn("hidden transition-[width] duration-product ease-product lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:block", sidebarCollapsed ? "lg:w-[72px]" : "lg:w-[264px]")}>
        <Sidebar collapsed={sidebarCollapsed} />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button type="button" aria-label="Fechar menu" className="absolute inset-0 animate-fade-in bg-foreground/25 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[min(88vw,304px)] animate-slide-up shadow-floating">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className={cn("min-h-screen transition-[padding] duration-product ease-product", sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-[264px]")}>
        <Topbar title={currentItem?.title ?? "Essencial Stay"} onMenuClick={() => setMobileOpen(true)} onCollapseClick={() => setSidebarCollapsed((current) => !current)} sidebarCollapsed={sidebarCollapsed} />
        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div key={location.pathname} className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
