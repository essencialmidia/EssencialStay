import { Building2, ChevronDown, Plus, Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useOrganization } from "../../contexts/organization-context";
import { usePlatformAdmin } from "../../contexts/platform-admin-context";
import { cn } from "../../lib/utils";
import { DropdownMenu, type DropdownItem } from "../ui/dropdown-menu";

type CompanySwitcherProps = {
  className?: string;
  compact?: boolean;
  eyebrow?: string;
};

export function CompanySwitcher({ className, compact = false, eyebrow = "Empresa atual" }: CompanySwitcherProps) {
  const { organizacoesAtivas, organizacaoAtual, setOrganizacaoAtualId } = useOrganization();
  const { canManagePlatform } = usePlatformAdmin();
  const navigate = useNavigate();
  const displayName = organizacaoAtual?.nome_fantasia || organizacaoAtual?.nome || "Selecionar empresa";

  const items: DropdownItem[] = organizacoesAtivas.map((organizacao) => ({
    key: organizacao.id,
    label: organizacao.nome_fantasia || organizacao.nome,
    icon: Building2,
    selected: organizacao.id === organizacaoAtual?.id,
    onClick: () => {
      setOrganizacaoAtualId(organizacao.id);
      navigate("/dashboard");
    },
  }));

  if (canManagePlatform) {
    items.push(
      { key: "nova-empresa", label: "Nova empresa cliente", icon: Plus, separatorBefore: true, onClick: () => navigate("/onboarding?modo=nova-empresa") },
      { key: "gerenciar-empresas", label: "Gerenciar empresas", icon: Settings2, onClick: () => navigate("/admin/empresas") },
    );
  }

  return (
    <DropdownMenu
      align="left"
      items={items}
      triggerAriaLabel={`Empresa atual: ${displayName}`}
      triggerClassName={cn("block max-w-full rounded-md", className)}
      contentClassName="w-[min(20rem,calc(100vw-2rem))]"
      trigger={
        <span className={cn("flex h-10 min-w-0 items-center gap-2 rounded-md px-2 text-left transition-colors hover:bg-secondary/70", !compact && "min-w-56")}>
          <span className="grid size-8 shrink-0 place-items-center rounded-md border bg-card text-xs font-semibold shadow-xs">
            {displayName.slice(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[11px] leading-4 text-muted-foreground">{eyebrow}</span>
            <span className="block truncate text-sm font-medium leading-4">{displayName}</span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </span>
      }
    />
  );
}
