import {
  BarChart3,
  Beaker,
  BedDouble,
  CalendarDays,
  CreditCard,
  Building2,
  Cpu,
  Gauge,
  Hotel,
  LifeBuoy,
  MessageSquareText,
  MapPinned,
  PlugZap,
  Sparkles,
  UsersRound,
  Wrench,
} from "lucide-react";
import type { NavigationItem } from "../types/navigation";

export const navigationSections: Array<{ label: string; items: NavigationItem[] }> = [
  {
    label: "Gestão",
    items: [
      { title: "Dashboard", path: "/dashboard", icon: Gauge, description: "Visão geral da operação." },
      { title: "Propriedades", path: "/propriedades", icon: Hotel, description: "Propriedades e unidades da empresa atual." },
      { title: "Ambientes", path: "/ambientes", icon: MapPinned, description: "Ambientes físicos das propriedades." },
      { title: "Reservas", path: "/reservas", icon: CalendarDays, description: "Agenda e fluxo de hospedagens." },
      { title: "Histórico e CRM", path: "/hospedes", icon: UsersRound, description: "Histórico, preferências e relacionamento com hóspedes." },
      { title: "Experiência do Hóspede", path: "/experiencia-hospede", icon: MessageSquareText, description: "Jornada digital antes, durante e após a estadia." },
    ],
  },
  {
    label: "Operação",
    items: [
      { title: "Limpeza", path: "/limpeza", icon: BedDouble, description: "Fila operacional de preparação das unidades." },
      { title: "Manutenção", path: "/manutencao", icon: Wrench, description: "Chamados e acompanhamento técnico." },
    ],
  },
  {
    label: "IoT",
    items: [
      { title: "Automation Lab", path: "/automation-lab", icon: Beaker, description: "Integração, homologação e testes controlados." },
      { title: "Dispositivos", path: "/dispositivos", icon: Cpu, description: "Inventário técnico por propriedade e ambiente." },
      { title: "Integrações", path: "/integracoes", icon: PlugZap, description: "Provedores e ambientes de integração." },
      { title: "Automação", path: "/automacao", icon: Sparkles, soon: true, description: "Cenas e regras inteligentes futuras." },
    ],
  },
  {
    label: "Análises",
    items: [
      { title: "Relatórios", path: "/relatorios", icon: BarChart3, soon: true, description: "Indicadores e análises da operação." },
      { title: "Financeiro", path: "/financeiro", icon: CreditCard, soon: true, description: "Receitas, pagamentos e faturamento futuro." },
    ],
  },
  {
    label: "Sistema",
    items: [
      { title: "Empresa", path: "/configuracoes", icon: Building2, description: "Tenant e dados cadastrais da empresa cliente." },
    ],
  },
];

export const navigationItems = navigationSections.flatMap((section) => section.items);

export const supportItem: NavigationItem = {
  title: "Suporte",
  path: "/configuracoes",
  icon: LifeBuoy,
  description: "Central de ajuda e suporte.",
};

export function getNavigationItem(pathname: string) {
  return navigationItems.find((item) => item.path === pathname)
    ?? navigationItems.find((item) => pathname.startsWith(`${item.path}/`));
}
