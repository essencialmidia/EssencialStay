import type { ConfiguracaoAutomacaoInput } from "../repositories/automacao.repository";
import type { InstaladorAutomacao, MarcaAutomacao, RecursoAutomacao, StatusAutomacao, StatusInstalacaoAutomacao } from "../types/database";

export const situacoesRecursos = ["nao_possui", "possui", "instalacao_futura"] as const;
export const marcasAutomacao = ["akubela", "tuya", "ekaza", "aqara", "shelly", "sonoff", "control4", "knx", "outra", "nao_informada"] as const;
export const situacoesInstalacao = ["funcionando", "parcial", "em_instalacao", "planejada"] as const;
export const instaladoresAutomacao = ["essencial_stay", "parceiro", "outro_fornecedor", "proprietario", "nao_informado"] as const;
export const recursosDisponiveis = ["painel", "fechadura", "iluminacao", "ar_condicionado", "cortinas", "sensores", "tv", "tomadas", "cenas", "economia_energia", "outro"] as const;

export type RecursosInteligentesInput = {
  situacao: StatusAutomacao;
  marca?: MarcaAutomacao;
  outraMarca?: string;
  modelo?: string;
  situacaoInstalacao?: StatusInstalacaoAutomacao;
  instalador?: InstaladorAutomacao;
  outroInstalador?: string;
  recursos?: RecursoAutomacao[];
};

export type RecursosInteligentesMapeados = Omit<ConfiguracaoAutomacaoInput, "propriedade_id">;

export const nomesMarcas: Record<MarcaAutomacao, string> = {
  akubela: "Akubela", tuya: "Tuya", ekaza: "Ekaza", aqara: "Aqara", shelly: "Shelly", sonoff: "Sonoff",
  control4: "Control4", knx: "KNX", outra: "Outra", nao_informada: "Não informada",
};

export const nomesSituacaoAutomacao: Record<StatusAutomacao, string> = {
  nao_possui: "Não possui",
  possui: "Já possui",
  instalacao_futura: "Será instalada",
};

export const nomesRecursos: Record<RecursoAutomacao, string> = {
  painel: "Painel inteligente", fechadura: "Fechadura inteligente", iluminacao: "Iluminação inteligente",
  ar_condicionado: "Ar-condicionado", cortinas: "Cortinas", sensores: "Sensores", tv: "TV", tomadas: "Tomadas",
  cenas: "Cenas", economia_energia: "Economia de energia", outro: "Outro",
};

export const nomesSituacaoInstalacao: Record<StatusInstalacaoAutomacao, string> = {
  funcionando: "Em funcionamento", parcial: "Instalada parcialmente", em_instalacao: "Em instalação", planejada: "Planejada",
};

export const nomesInstaladores: Record<InstaladorAutomacao, string> = {
  essencial_stay: "Essencial Stay", parceiro: "Parceiro", outro_fornecedor: "Outro fornecedor", proprietario: "Proprietário", nao_informado: "Não informado",
};

export function mapearRecursosInteligentes(input: RecursosInteligentesInput): RecursosInteligentesMapeados {
  const semAutomacao = input.situacao === "nao_possui";
  return {
    possui_automacao: input.situacao,
    marca: semAutomacao ? "nao_informada" : input.marca ?? "nao_informada",
    marca_outro: input.marca === "outra" ? input.outraMarca?.trim() || null : null,
    modelo: semAutomacao ? null : input.modelo?.trim() || null,
    situacao_instalacao: semAutomacao ? null : input.situacao === "instalacao_futura" ? "planejada" : input.situacaoInstalacao ?? null,
    instalador_responsavel: semAutomacao ? "nao_informado" : input.instalador ?? "nao_informado",
    instalador_outro: input.instalador === "outro_fornecedor" ? input.outroInstalador?.trim() || null : null,
    recursos: semAutomacao ? [] : input.recursos ?? [],
  };
}
