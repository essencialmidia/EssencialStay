import { Bell, Menu, PanelLeftClose, PanelLeftOpen, Search, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeSelector } from "../navigation/theme-selector";
import { CompanySwitcher } from "../navigation/company-switcher";
import { useAuth } from "../../contexts/auth-context";
import { usePlatformAdmin } from "../../contexts/platform-admin-context";
import { useOrganization } from "../../contexts/organization-context";
import { logout } from "../../services/auth.service";
import { Avatar } from "../ui/avatar";
import { Button } from "../ui/button";
import { DropdownMenu } from "../ui/dropdown-menu";
import { Tooltip } from "../ui/tooltip";
import { useToast } from "../ui/toast";
import { getAuthErrorMessage } from "../../lib/auth-error";

type TopbarProps = {
  title: string;
  sidebarCollapsed: boolean;
  onMenuClick: () => void;
  onCollapseClick: () => void;
};

export function Topbar({ title, sidebarCollapsed, onMenuClick, onCollapseClick }: TopbarProps) {
  const { isPlatformAdmin } = usePlatformAdmin();
  const { organizacaoAdministrativa, limparOrganizacaoAdministrativa } = useOrganization();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const displayName: string = typeof user?.user_metadata.nome_completo === "string" ? user.user_metadata.nome_completo : user?.email ?? "Usuário";
  const initials = displayName.split(/\s+/).slice(0, 2).map((part: string) => part[0]).join("").toUpperCase();

  async function handleLogout() {
    try {
      await logout();
      showToast("Sessão encerrada.");
      navigate("/login", { replace: true });
    } catch (error) {
      showToast(getAuthErrorMessage(error, "Não foi possível encerrar a sessão."), "error");
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-xl">
      {organizacaoAdministrativa && <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-b border-accent/25 bg-accent/10 px-4 py-2 text-sm sm:px-6 lg:px-8"><span className="min-w-0"><span className="mr-2 text-xs font-semibold uppercase tracking-wide text-accent">Empresa selecionada</span><span className="break-words font-medium">{organizacaoAdministrativa.nome_fantasia || organizacaoAdministrativa.nome}</span><span className="ml-2 hidden text-xs text-muted-foreground sm:inline">· acesso como administrador global</span></span><Button size="sm" variant="outline" onClick={() => { limparOrganizacaoAdministrativa(); navigate("/admin"); }}>Voltar à administração</Button></div>}
      <div className="flex h-[72px] items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick} aria-label="Abrir navegação">
          <Menu className="size-5" />
        </Button>
        <Tooltip content={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}>
          <Button variant="ghost" size="icon" className="hidden lg:inline-flex" onClick={onCollapseClick} aria-label={sidebarCollapsed ? "Expandir sidebar" : "Recolher sidebar"}>
            {sidebarCollapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
          </Button>
        </Tooltip>

        <div className="min-w-0 flex-1 lg:hidden"><CompanySwitcher compact eyebrow={title} /></div>
        <CompanySwitcher className="hidden lg:block" />

        <div className="mx-auto hidden max-w-md flex-1 md:block">
          <button type="button" className="flex h-9 w-full items-center gap-2 rounded-md border bg-card px-3 text-sm text-muted-foreground shadow-xs transition-colors hover:bg-secondary/55" aria-label="Busca visual ainda não implementada">
            <Search className="size-4" aria-hidden="true" />
            <span className="flex-1 text-left">Buscar na plataforma</span>
          </button>
        </div>

        <div className="flex items-center gap-0.5">
          {isPlatformAdmin && <Tooltip content="Administração Essencial Stay"><Button variant="ghost" size="icon" onClick={() => navigate("/admin")} aria-label="Abrir administração global"><ShieldCheck className="size-[18px]" /></Button></Tooltip>}
          <ThemeSelector />
          <Tooltip content="Notificações">
            <Button variant="ghost" size="icon" aria-label="Alertas e notificações">
              <span className="relative">
                <Bell className="size-[18px]" />
                <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-highlight ring-2 ring-background" />
              </span>
            </Button>
          </Tooltip>
          <DropdownMenu
            align="right"
            trigger={<Avatar aria-label={`Menu de ${displayName}`}>{initials || "ES"}</Avatar>}
            items={[
              { label: "Perfil e preferências", onClick: () => navigate("/configuracoes") },
              { label: "Empresa atual", onClick: () => navigate("/configuracoes") },
              ...(isPlatformAdmin ? [{ label: "Administração global", onClick: () => navigate("/admin") }] : []),
              { label: "Sair", onClick: () => void handleLogout(), destructive: true },
            ]}
          />
        </div>
      </div>
    </header>
  );
}
