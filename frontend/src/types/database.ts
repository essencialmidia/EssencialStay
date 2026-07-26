export type Perfil = {
  id: string;
  nome_completo: string | null;
  telefone: string | null;
  avatar_url: string | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
};

export type TipoOrganizacao = "pessoa_fisica" | "pessoa_juridica";
export type StatusOrganizacao = "ativo" | "suspenso" | "cancelado";

export type Organizacao = {
  id: string;
  nome: string;
  nome_fantasia: string | null;
  documento: string | null;
  tipo: TipoOrganizacao;
  email: string | null;
  telefone: string | null;
  logo_url: string | null;
  status: StatusOrganizacao;
  criado_em: string;
  atualizado_em: string;
};

export type PapelMembro = "proprietario" | "administrador" | "gerente" | "recepcao" | "limpeza" | "manutencao";

export type MembroOrganizacao = {
  id: string;
  organizacao_id: string;
  perfil_id: string;
  papel: PapelMembro;
  ativo: boolean;
  criado_em: string;
};

export type PapelAdministradorPlataforma = "proprietario" | "administrador" | "suporte";

export type AdministradorPlataforma = {
  id: string;
  perfil_id: string;
  papel: PapelAdministradorPlataforma;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
};

export const tiposPropriedade = ["hotel", "pousada", "casa", "apartamento", "chale", "bangalo", "outro"] as const;
export type TipoPropriedade = (typeof tiposPropriedade)[number];
export const nomesTiposPropriedade: Record<TipoPropriedade, string> = {
  hotel: "Hotel",
  pousada: "Pousada",
  casa: "Casa",
  apartamento: "Apartamento",
  chale: "Chalé",
  bangalo: "Bangalô",
  outro: "Outro",
};
export type StatusPropriedade = "ativa" | "inativa";

export type Propriedade = {
  id: string;
  organizacao_id: string;
  nome: string;
  nome_fantasia: string | null;
  documento: string | null;
  tipo: TipoPropriedade;
  descricao: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  pais: string;
  fuso_horario: string;
  antecedencia_estado_reservada_horas: number;
  horario_checkin: string | null;
  horario_checkout: string | null;
  wifi_nome: string | null;
  wifi_senha: string | null;
  status: StatusPropriedade;
  criado_em: string;
  atualizado_em: string;
  automacao_status: StatusAutomacao;
  automacao_marca: Exclude<MarcaAutomacao, "sonoff" | "nao_informada"> | null;
  automacao_marca_outro: string | null;
  automacao_instalacao_status: StatusInstalacaoAutomacao | null;
  automacao_recursos: Array<Exclude<RecursoAutomacao, "cenas"> | "cena_boas_vindas">;
  automacao_configurada: boolean;
};

export const tiposUnidade = ["standard", "luxo", "suite", "chale", "bangalo", "casa", "apartamento", "outro"] as const;
export type TipoUnidade = (typeof tiposUnidade)[number];
export const nomesTiposUnidade: Record<TipoUnidade, string> = {
  standard: "Standard",
  luxo: "Luxo",
  suite: "Suíte",
  chale: "Chalé",
  bangalo: "Bangalô",
  casa: "Casa",
  apartamento: "Apartamento",
  outro: "Outro",
};

const aliasesTiposUnidade: Record<string, TipoUnidade> = {
  standard: "standard",
  padrao: "standard",
  quarto: "standard",
  luxo: "luxo",
  luxury: "luxo",
  deluxe: "luxo",
  suite: "suite",
  chale: "chale",
  bangalo: "bangalo",
  casa: "casa",
  casa_inteira: "casa",
  apartamento: "apartamento",
  apto: "apartamento",
  flat: "apartamento",
  outro: "outro",
  outra: "outro",
  propriedade_inteira: "outro",
};

export function normalizarTipoUnidade(value: string): TipoUnidade {
  const normalized = value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[\s-]+/g, "_");

  return aliasesTiposUnidade[normalized] ?? "outro";
}
export const statusOperacionaisUnidade = ["disponivel", "reservada", "preparando", "pronta_checkin", "ocupada", "aguardando_limpeza", "em_limpeza"] as const;
export type StatusOperacionalUnidade = (typeof statusOperacionaisUnidade)[number];
export type StatusUnidade = StatusOperacionalUnidade;
export const nomesStatusOperacionalUnidade: Record<StatusOperacionalUnidade, string> = {
  disponivel: "Disponível",
  reservada: "Reservada",
  preparando: "Em preparação",
  pronta_checkin: "Pronta para check-in",
  ocupada: "Ocupada",
  aguardando_limpeza: "Aguardando limpeza",
  em_limpeza: "Em limpeza",
};

export type EstadoConsolidadoUnidade = StatusOperacionalUnidade | "manutencao" | "bloqueada";
export const nomesEstadosConsolidadosUnidade: Record<EstadoConsolidadoUnidade, string> = {
  ...nomesStatusOperacionalUnidade,
  manutencao: "Manutenção impeditiva",
  bloqueada: "Bloqueada",
};

export type Unidade = {
  id: string;
  propriedade_id: string;
  nome: string;
  codigo: string | null;
  tipo: TipoUnidade;
  andar: string | null;
  numero_identificacao: string | null;
  capacidade_hospedes: number | null;
  status_operacional: StatusOperacionalUnidade;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
};

export type EstadoUnidade = {
  unidade_id: string;
  organizacao_id: string;
  propriedade_id: string;
  estado_jornada: StatusOperacionalUnidade;
  estado_consolidado: EstadoConsolidadoUnidade;
  bloqueio_impeditivo_id: string | null;
  tipo_restricao: TipoBloqueioUnidade | null;
  versao: number;
  atualizado_em: string;
  atualizado_por: string | null;
};

export const tiposTarefaOperacional = ["preparacao", "limpeza", "manutencao"] as const;
export type TipoTarefaOperacional = (typeof tiposTarefaOperacional)[number];
export const nomesTiposTarefaOperacional: Record<TipoTarefaOperacional, string> = {
  preparacao: "Preparação",
  limpeza: "Limpeza",
  manutencao: "Manutenção",
};
export const statusTarefaOperacional = ["pendente", "em_andamento", "concluida", "cancelada"] as const;
export type StatusTarefaOperacional = (typeof statusTarefaOperacional)[number];
export const nomesStatusTarefaOperacional: Record<StatusTarefaOperacional, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};
export const prioridadesTarefaOperacional = ["baixa", "normal", "alta", "urgente"] as const;
export type PrioridadeTarefaOperacional = (typeof prioridadesTarefaOperacional)[number];
export const nomesPrioridadesTarefaOperacional: Record<PrioridadeTarefaOperacional, string> = {
  baixa: "Baixa",
  normal: "Normal",
  alta: "Alta",
  urgente: "Urgente",
};

export type TarefaOperacional = {
  id: string;
  organizacao_id: string;
  propriedade_id: string;
  unidade_id: string;
  tipo: TipoTarefaOperacional;
  status: StatusTarefaOperacional;
  prioridade: PrioridadeTarefaOperacional;
  titulo: string;
  descricao: string | null;
  obrigatoria: boolean;
  responsavel_perfil_id: string | null;
  agendada_para: string | null;
  prazo_em: string | null;
  iniciada_em: string | null;
  concluida_em: string | null;
  versao: number;
  criado_por: string | null;
  concluida_por: string | null;
  criado_em: string;
  atualizado_em: string;
};

export const tiposBloqueioUnidade = ["manutencao", "manual", "pms"] as const;
export type TipoBloqueioUnidade = (typeof tiposBloqueioUnidade)[number];
export const nomesTiposBloqueioUnidade: Record<TipoBloqueioUnidade, string> = {
  manutencao: "Manutenção",
  manual: "Bloqueio manual",
  pms: "PMS",
};
export type SituacaoBloqueioUnidade = "ativo" | "encerrado" | "cancelado";

export type BloqueioUnidade = {
  id: string;
  organizacao_id: string;
  propriedade_id: string;
  unidade_id: string;
  tipo: TipoBloqueioUnidade;
  motivo: string;
  impeditivo: boolean;
  situacao: SituacaoBloqueioUnidade;
  inicio_em: string;
  fim_em: string | null;
  conexao_id: string | null;
  identificador_externo: string | null;
  criado_por: string | null;
  encerrado_por: string | null;
  encerrado_em: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type ResumoOperacional = {
  total_unidades: number;
  disponiveis: number;
  reservadas: number;
  preparando: number;
  prontas_checkin: number;
  ocupadas: number;
  aguardando_limpeza: number;
  em_limpeza: number;
  manutencoes_impeditivas: number;
  bloqueios_impeditivos: number;
  tarefas_pendentes: number;
};

export type FusoHorario = {
  nome: string;
  deslocamento_atual: string;
};

export type StatusAutomacao = "nao_possui" | "possui" | "instalacao_futura";
export type MarcaAutomacao = "akubela" | "tuya" | "ekaza" | "aqara" | "shelly" | "sonoff" | "control4" | "knx" | "outra" | "nao_informada";
export type StatusInstalacaoAutomacao = "funcionando" | "parcial" | "em_instalacao" | "planejada";
export type InstaladorAutomacao = "essencial_stay" | "parceiro" | "outro_fornecedor" | "proprietario" | "nao_informado";
export type RecursoAutomacao = "painel" | "fechadura" | "iluminacao" | "ar_condicionado" | "cortinas" | "sensores" | "tv" | "tomadas" | "cenas" | "economia_energia" | "outro";

export type ConfiguracaoAutomacaoPropriedade = {
  id: string;
  propriedade_id: string;
  possui_automacao: StatusAutomacao;
  marca: MarcaAutomacao;
  marca_outro: string | null;
  modelo: string | null;
  situacao_instalacao: StatusInstalacaoAutomacao | null;
  instalador_responsavel: InstaladorAutomacao;
  instalador_outro: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type RecursoAutomacaoPropriedade = {
  id: string;
  configuracao_id: string;
  recurso: RecursoAutomacao;
  criado_em: string;
};

export type CategoriaIntegracao = "pms" | "channel_manager" | "motor_reservas" | "checkin_digital" | "grms" | "ia";

export type IntegracaoPropriedade = {
  id: string;
  propriedade_id: string;
  categoria: CategoriaIntegracao;
  provedor: string | null;
  status: "nao_configurada" | "configurada" | "ativa" | "pausada" | "erro";
  metadados: Record<string, unknown>;
  criado_em: string;
  atualizado_em: string;
};

export type Ambiente = {
  id: string;
  organizacao_id: string;
  propriedade_id: string;
  unidade_id: string | null;
  ambiente_pai_id: string | null;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
};

export type Pagina<T> = {
  itens: T[];
  total: number;
  pagina: number;
  tamanhoPagina: number;
};

export const ambientesExecucaoIntegracao = ["producao", "sandbox", "laboratorio"] as const;
export type AmbienteExecucaoIntegracao = (typeof ambientesExecucaoIntegracao)[number];
export const nomesAmbientesExecucaoIntegracao: Record<AmbienteExecucaoIntegracao, string> = {
  producao: "Produção",
  sandbox: "Sandbox",
  laboratorio: "Laboratório",
};

export const statusIntegracao = ["desconectada", "conectando", "conectada", "erro", "desativada"] as const;
export type StatusIntegracao = (typeof statusIntegracao)[number];
export const nomesStatusIntegracao: Record<StatusIntegracao, string> = {
  desconectada: "Desconectada",
  conectando: "Conectando",
  conectada: "Conectada",
  erro: "Erro",
  desativada: "Desativada",
};

export type ProvedorIntegracao = {
  id: string;
  codigo: string;
  nome: string;
  categoria: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
};

export type ConexaoIntegracaoPropriedade = {
  id: string;
  organizacao_id: string;
  propriedade_id: string;
  conexao_id: string;
  identificador_externo: string | null;
  configuracao: Record<string, unknown>;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
};

export type ConexaoIntegracao = {
  id: string;
  organizacao_id: string;
  provedor_id: string;
  provedor: ProvedorIntegracao;
  ambiente_execucao: AmbienteExecucaoIntegracao;
  status: StatusIntegracao;
  nome_exibicao: string;
  configuracao: Record<string, unknown>;
  propriedades: ConexaoIntegracaoPropriedade[];
  criado_em: string;
  atualizado_em: string;
};

export type ProtocoloDispositivo = {
  id: string;
  codigo: string;
  nome: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
};

export type CategoriaDispositivo = {
  id: string;
  codigo: string;
  nome: string;
  icone: string | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
};

export type CatalogoDispositivo = {
  id: string;
  categoria_id: string;
  categoria: CategoriaDispositivo;
  fabricante: string;
  modelo: string;
  icone: string | null;
  suportado: boolean;
  protocolos: Array<{ protocolo: ProtocoloDispositivo; principal: boolean }>;
  criado_em: string;
  atualizado_em: string;
};

export const statusCadastroDispositivo = ["ativo", "inativo", "manutencao"] as const;
export type StatusCadastroDispositivo = (typeof statusCadastroDispositivo)[number];
export const nomesStatusCadastroDispositivo: Record<StatusCadastroDispositivo, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  manutencao: "Manutenção",
};

export type EstadoDispositivo = {
  dispositivo_id: string;
  organizacao_id: string;
  propriedade_id: string;
  online: boolean | null;
  nivel_bateria: number | null;
  intensidade_sinal: number | null;
  estado: Record<string, unknown>;
  observado_em: string | null;
  atualizado_em: string;
};

export type Dispositivo = {
  id: string;
  organizacao_id: string;
  propriedade_id: string;
  ambiente_id: string | null;
  catalogo_id: string | null;
  nome: string;
  fabricante: string | null;
  modelo: string | null;
  numero_serie: string | null;
  versao_firmware: string | null;
  status_cadastro: StatusCadastroDispositivo;
  metadados: Record<string, unknown>;
  ambiente: { nome: string } | null;
  origens: Array<{ id: string }>;
  estado_atual: EstadoDispositivo | null;
  criado_em: string;
  atualizado_em: string;
};

export type OrigemDispositivo = {
  id: string;
  organizacao_id: string;
  propriedade_id: string;
  dispositivo_id: string;
  conexao_propriedade_id: string;
  identificador_externo: string;
  identificador_pai: string | null;
  metadados: Record<string, unknown>;
  visto_em: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type CapacidadeDispositivo = {
  id: string;
  organizacao_id: string;
  propriedade_id: string;
  dispositivo_id: string;
  codigo: string;
  permite_leitura: boolean;
  permite_escrita: boolean;
  configuracao: Record<string, unknown>;
  ativa: boolean;
  criado_em: string;
  atualizado_em: string;
};

export type EventoDispositivo = {
  id: number;
  organizacao_id: string;
  propriedade_id: string;
  dispositivo_id: string;
  origem_id: string | null;
  tipo_evento: string;
  chave_idempotencia: string | null;
  versao_schema: number;
  payload: Record<string, unknown>;
  ocorrido_em: string;
  recebido_em: string;
};
