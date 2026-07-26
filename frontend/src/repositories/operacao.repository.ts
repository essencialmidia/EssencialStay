import { supabase } from "../lib/supabase";
import { withSupabaseStatus } from "../lib/supabase-error";
import type {
  BloqueioUnidade,
  EstadoUnidade,
  Pagina,
  PrioridadeTarefaOperacional,
  ResumoOperacional,
  StatusOperacionalUnidade,
  StatusTarefaOperacional,
  TarefaOperacional,
  TipoBloqueioUnidade,
  TipoTarefaOperacional,
} from "../types/database";

export type ListarEstadosUnidadeInput = {
  organizacaoId: string;
  propriedadeId?: string;
  estadoConsolidado?: EstadoUnidade["estado_consolidado"];
  cursor?: EstadoUnidadeCursor | null;
  tamanhoPagina: number;
};

export type EstadoUnidadeCursor = {
  atualizadoEm: string;
  unidadeId: string;
};

export type PaginaCursorEstadosUnidade = {
  itens: EstadoUnidade[];
  proximoCursor: EstadoUnidadeCursor | null;
};

export async function listEstadosUnidade(input: ListarEstadosUnidadeInput): Promise<PaginaCursorEstadosUnidade> {
  const limiteConsulta = Math.min(input.tamanhoPagina + 1, 200);
  const { data, error, status } = await supabase.rpc("listar_estados_unidade_operacionais", {
    p_organizacao_id: input.organizacaoId,
    p_propriedade_id: input.propriedadeId ?? null,
    p_estado_consolidado: input.estadoConsolidado ?? null,
    p_cursor_atualizado_em: input.cursor?.atualizadoEm ?? null,
    p_cursor_unidade_id: input.cursor?.unidadeId ?? null,
    p_limite: limiteConsulta,
  });
  if (error) throw withSupabaseStatus(error, status);
  const resultados = (data ?? []) as EstadoUnidade[];
  const itens = resultados.slice(0, input.tamanhoPagina);
  const ultimoItem = itens[itens.length - 1];
  return {
    itens,
    proximoCursor: resultados.length > input.tamanhoPagina && ultimoItem
      ? { atualizadoEm: ultimoItem.atualizado_em, unidadeId: ultimoItem.unidade_id }
      : null,
  };
}

export type ListarTarefasInput = {
  organizacaoId: string;
  propriedadeId?: string;
  tipo?: TipoTarefaOperacional;
  status?: StatusTarefaOperacional;
  pagina: number;
  tamanhoPagina: number;
};

export async function listTarefasOperacionais(input: ListarTarefasInput): Promise<Pagina<TarefaOperacional>> {
  const inicio = (input.pagina - 1) * input.tamanhoPagina;
  let query = supabase
    .from("tarefas_operacionais")
    .select("*", { count: "exact" })
    .eq("organizacao_id", input.organizacaoId)
    .order("atualizado_em", { ascending: false })
    .order("id", { ascending: false })
    .range(inicio, inicio + input.tamanhoPagina - 1);
  if (input.propriedadeId) query = query.eq("propriedade_id", input.propriedadeId);
  if (input.tipo) query = query.eq("tipo", input.tipo);
  if (input.status) query = query.eq("status", input.status);
  const { data, count, error, status } = await query;
  if (error) throw withSupabaseStatus(error, status);
  return { itens: data ?? [], total: count ?? 0, pagina: input.pagina, tamanhoPagina: input.tamanhoPagina };
}

export type ListarBloqueiosInput = {
  organizacaoId: string;
  propriedadeId?: string;
  situacao?: "ativo" | "encerrado" | "cancelado";
  pagina: number;
  tamanhoPagina: number;
};

export async function listBloqueiosUnidade(input: ListarBloqueiosInput): Promise<Pagina<BloqueioUnidade>> {
  const inicio = (input.pagina - 1) * input.tamanhoPagina;
  let query = supabase
    .from("bloqueios_unidade")
    .select("*", { count: "exact" })
    .eq("organizacao_id", input.organizacaoId)
    .order("criado_em", { ascending: false })
    .order("id", { ascending: false })
    .range(inicio, inicio + input.tamanhoPagina - 1);
  if (input.propriedadeId) query = query.eq("propriedade_id", input.propriedadeId);
  if (input.situacao) query = query.eq("situacao", input.situacao);
  const { data, count, error, status } = await query;
  if (error) throw withSupabaseStatus(error, status);
  return { itens: data ?? [], total: count ?? 0, pagina: input.pagina, tamanhoPagina: input.tamanhoPagina };
}

export async function getResumoOperacional(organizacaoId: string, propriedadeId?: string): Promise<ResumoOperacional> {
  const { data, error, status } = await supabase.rpc("obter_resumo_operacional", {
    p_organizacao_id: organizacaoId,
    p_propriedade_id: propriedadeId ?? null,
  });
  if (error) throw withSupabaseStatus(error, status);
  const item = Array.isArray(data) ? data[0] : data;
  return {
    total_unidades: Number(item?.total_unidades ?? 0),
    disponiveis: Number(item?.disponiveis ?? 0),
    reservadas: Number(item?.reservadas ?? 0),
    preparando: Number(item?.preparando ?? 0),
    prontas_checkin: Number(item?.prontas_checkin ?? 0),
    ocupadas: Number(item?.ocupadas ?? 0),
    aguardando_limpeza: Number(item?.aguardando_limpeza ?? 0),
    em_limpeza: Number(item?.em_limpeza ?? 0),
    manutencoes_impeditivas: Number(item?.manutencoes_impeditivas ?? 0),
    bloqueios_impeditivos: Number(item?.bloqueios_impeditivos ?? 0),
    tarefas_pendentes: Number(item?.tarefas_pendentes ?? 0),
  };
}

export async function transitionEstadoUnidade(input: {
  unidadeId: string;
  estadoDestino: StatusOperacionalUnidade;
  versaoEsperada: number;
  chaveIdempotencia: string;
  justificativa?: string | null;
}): Promise<EstadoUnidade> {
  const { data, error, status } = await supabase.rpc("transicionar_estado_unidade", {
    p_unidade_id: input.unidadeId,
    p_estado_destino: input.estadoDestino,
    p_versao_esperada: input.versaoEsperada,
    p_chave_idempotencia: input.chaveIdempotencia,
    p_correlacao_id: crypto.randomUUID(),
    p_justificativa: input.justificativa?.trim() || null,
  });
  if (error) throw withSupabaseStatus(error, status);
  return (Array.isArray(data) ? data[0] : data) as EstadoUnidade;
}

export async function createTarefaOperacional(input: {
  unidadeId: string;
  tipo: TipoTarefaOperacional;
  titulo: string;
  descricao?: string | null;
  prioridade: PrioridadeTarefaOperacional;
  obrigatoria: boolean;
  responsavelPerfilId?: string | null;
  agendadaPara?: string | null;
  prazoEm?: string | null;
  chaveIdempotencia: string;
  justificativa?: string | null;
}): Promise<string> {
  const { data, error, status } = await supabase.rpc("criar_tarefa_operacional", {
    p_unidade_id: input.unidadeId,
    p_tipo: input.tipo,
    p_titulo: input.titulo.trim(),
    p_descricao: input.descricao?.trim() || null,
    p_prioridade: input.prioridade,
    p_obrigatoria: input.obrigatoria,
    p_responsavel_perfil_id: input.responsavelPerfilId ?? null,
    p_agendada_para: input.agendadaPara ?? null,
    p_prazo_em: input.prazoEm ?? null,
    p_chave_idempotencia: input.chaveIdempotencia,
    p_correlacao_id: crypto.randomUUID(),
    p_justificativa: input.justificativa?.trim() || null,
  });
  if (error) throw withSupabaseStatus(error, status);
  return data as string;
}

export async function changeStatusTarefaOperacional(input: {
  tarefaId: string;
  statusDestino: StatusTarefaOperacional;
  versaoEsperada: number;
  chaveIdempotencia: string;
  justificativa?: string | null;
}): Promise<TarefaOperacional> {
  const { data, error, status } = await supabase.rpc("alterar_status_tarefa_operacional", {
    p_tarefa_id: input.tarefaId,
    p_status_destino: input.statusDestino,
    p_versao_esperada: input.versaoEsperada,
    p_chave_idempotencia: input.chaveIdempotencia,
    p_correlacao_id: crypto.randomUUID(),
    p_justificativa: input.justificativa?.trim() || null,
  });
  if (error) throw withSupabaseStatus(error, status);
  return (Array.isArray(data) ? data[0] : data) as TarefaOperacional;
}

export async function createBloqueioUnidade(input: {
  unidadeId: string;
  tipo: TipoBloqueioUnidade;
  motivo: string;
  impeditivo: boolean;
  inicioEm?: string | null;
  fimEm?: string | null;
  chaveIdempotencia: string;
  justificativa?: string | null;
}): Promise<string> {
  const { data, error, status } = await supabase.rpc("criar_bloqueio_unidade", {
    p_unidade_id: input.unidadeId,
    p_tipo: input.tipo,
    p_motivo: input.motivo.trim(),
    p_impeditivo: input.impeditivo,
    p_inicio_em: input.inicioEm ?? null,
    p_fim_em: input.fimEm ?? null,
    p_conexao_id: null,
    p_identificador_externo: null,
    p_chave_idempotencia: input.chaveIdempotencia,
    p_correlacao_id: crypto.randomUUID(),
    p_justificativa: input.justificativa?.trim() || null,
  });
  if (error) throw withSupabaseStatus(error, status);
  return data as string;
}

export async function closeBloqueioUnidade(input: {
  bloqueioId: string;
  chaveIdempotencia: string;
  justificativa?: string | null;
}): Promise<BloqueioUnidade> {
  const { data, error, status } = await supabase.rpc("encerrar_bloqueio_unidade", {
    p_bloqueio_id: input.bloqueioId,
    p_chave_idempotencia: input.chaveIdempotencia,
    p_correlacao_id: crypto.randomUUID(),
    p_justificativa: input.justificativa?.trim() || null,
  });
  if (error) throw withSupabaseStatus(error, status);
  return (Array.isArray(data) ? data[0] : data) as BloqueioUnidade;
}
