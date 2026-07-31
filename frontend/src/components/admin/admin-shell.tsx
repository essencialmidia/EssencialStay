import { BarChart3, Building2, ChevronDown, ExternalLink, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Settings2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/auth-context";
import { useOrganization } from "../../contexts/organization-context";
import { usePlatformAdmin } from "../../contexts/platform-admin-context";
import { getAuthErrorMessage } from "../../lib/auth-error";
import { cn } from "../../lib/utils";
import { logout } from "../../services/auth.service";
import { Avatar } from "../ui/avatar";
import { Button } from "../ui/button";
import { DropdownMenu } from "../ui/dropdown-menu";
import { Select } from "../ui/select";
import { ThemeSelector } from "../navigation/theme-selector";
import { BrandMark } from "../navigation/brand-mark";
import { useToast } from "../ui/toast";

const links = [
  { to: "/admin", label: "Visão global", icon: BarChart3, end: true },
  { to: "/admin/empresas", label: "Empresas clientes", icon: Building2, end: false },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings2, end: false },
];

export function AdminShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  return <div className="min-h-screen bg-background">
    <div className={cn("hidden transition-[width] lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:block", collapsed ? "lg:w-[72px]" : "lg:w-[264px]")}><AdminSidebar collapsed={collapsed} /></div>
    {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden"><button type="button" aria-label="Fechar menu" className="absolute inset-0 bg-foreground/25" onClick={() => setMobileOpen(false)} /><div className="absolute inset-y-0 left-0 w-[min(88vw,304px)]"><AdminSidebar onNavigate={() => setMobileOpen(false)} /></div></div>}
    <div className={cn("min-h-screen min-w-0 transition-[padding]", collapsed ? "lg:pl-[72px]" : "lg:pl-[264px]")}>
      <AdminTopbar collapsed={collapsed} onCollapse={() => setCollapsed((value) => !value)} onMenu={() => setMobileOpen(true)} />
      <main className="mx-auto min-w-0 w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8"><Outlet /></main>
    </div>
  </div>;
}

function AdminSidebar({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const { administrador } = usePlatformAdmin();
  return <aside className="flex h-full flex-col border-r border-white/[0.08] bg-sidebar text-sidebar-foreground">
    <div className={cn("flex h-[72px] items-center border-b border-white/[0.08]", collapsed ? "justify-center px-2" : "px-5")}><BrandMark compact={collapsed} inverted /></div>
    <div className={cn("border-b border-white/[0.08] py-4", collapsed ? "px-3" : "px-5")}><div className={cn("flex items-center gap-3", collapsed && "justify-center")}><div className="grid size-9 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground"><ShieldCheck className="size-4" /></div>{!collapsed && <div><p className="text-sm font-semibold text-white">Administração</p><p className="mt-0.5 text-xs capitalize text-sidebar-foreground/55">{administrador?.papel}</p></div>}</div></div>
    <nav className="flex-1 space-y-1 px-3 py-4">{links.map((item) => <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate} title={collapsed ? item.label : undefined} className={({ isActive }) => cn("flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-sidebar-foreground/65 transition-colors hover:bg-white/[0.06] hover:text-white", isActive && "bg-sidebar-active text-white", collapsed && "justify-center px-2")}><item.icon className="size-[18px]" />{!collapsed && item.label}</NavLink>)}</nav>
  </aside>;
}

function AdminTopbar({ collapsed, onCollapse, onMenu }: { collapsed: boolean; onCollapse: () => void; onMenu: () => void }) {
  const { organizacoesAtivas } = useOrganization();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const displayName = typeof user?.user_metadata.nome_completo === "string" ? user.user_metadata.nome_completo : user?.email ?? "Administrador";
  const initials = displayName.split(/\s+/).slice(0, 2).map((part: string) => part[0]).join("").toUpperCase();
  async function handleLogout() { try { await logout(); navigate("/login", { replace: true }); } catch (error) { showToast(getAuthErrorMessage(error, "Não foi possível sair."), "error"); } }
  function selectContext(value: string) { if (value === "admin") { navigate("/admin"); return; } navigate(`/admin/empresas/${value}/painel`); }
  return <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-xl"><div className="flex h-[72px] items-center gap-2 px-4 sm:px-6 lg:px-8">
    <Button size="icon" variant="ghost" className="lg:hidden" onClick={onMenu} aria-label="Abrir navegação"><Menu className="size-5" /></Button><Button size="icon" variant="ghost" className="hidden lg:inline-flex" onClick={onCollapse} aria-label="Alternar sidebar">{collapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}</Button>
    <div className="relative min-w-0 max-w-xs flex-1"><span className="hidden text-[11px] font-medium leading-4 text-muted-foreground sm:block">Visão atual</span><Select value="admin" onChange={(event) => selectContext(event.target.value)} className="h-9 appearance-none truncate pr-8 font-medium sm:-ml-3 sm:border-transparent sm:bg-transparent sm:shadow-none" aria-label="Alterar visão atual"><option value="admin">Administração da plataforma</option>{organizacoesAtivas.map((item) => <option key={item.id} value={item.id}>Empresa selecionada: {item.nome_fantasia || item.nome}</option>)}</Select><ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /></div>
    <div className="ml-auto flex items-center gap-1"><Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={() => window.open("/demo/29-07", "_blank", "noopener,noreferrer")}><ExternalLink className="size-4" />Apresentar demo</Button><ThemeSelector /><DropdownMenu align="right" trigger={<Avatar>{initials || "ES"}</Avatar>} items={[{ label: "Sair", onClick: () => void handleLogout(), destructive: true }]} /><Button variant="ghost" size="icon" className="hidden" aria-label="Sair"><LogOut className="size-4" /></Button></div>
  </div></header>;
}
