import { supabase } from "../lib/supabase";
import { withSupabaseStatus } from "../lib/supabase-error";
import type { AmbienteExecucaoIntegracao, ConexaoIntegracao, Pagina, StatusIntegracao } from "../types/database";

export type ConexaoIntegracaoSave = {
  id?: string | null;
  organizacao_id: string;
  provedor_id: string;
  nome_exibicao: string;
  ambiente_execucao: AmbienteExecucaoIntegracao;
  status: StatusIntegracao;
  propriedade_ids: string[];
};

export type ConexaoIntegracaoUpdate = {
  id: string;
  status?: StatusIntegracao;
};

export type ConexaoIntegracaoListFilters = {
  organizacaoId: string;
  busca?: string;
  propriedadeId?: string;
  provedorId?: string;
  status?: StatusIntegracao;
  pagina?: number;
  tamanhoPagina?: number;
};

const selectConexao = `
  *,
  provedor:provedores_integracao(*),
  propriedades:conexoes_integracao_propriedades(*)
`;

export async function listConexoesIntegracao({ organizacaoId, busca, propriedadeId, provedorId, status: statusFiltro, pagina = 1, tamanhoPagina = 25 }: ConexaoIntegracaoListFilters): Promise<Pagina<ConexaoIntegracao>> {
  const inicio = (pagina - 1) * tamanhoPagina;
  const select = propriedadeId
    ? `${selectConexao}, filtro_propriedade:conexoes_integracao_propriedades!inner(propriedade_id, ativo)`
    : selectConexao;
  let query = supabase
    .from("conexoes_integracao")
    .select(select as "*", { count: "exact" })
    .eq("organizacao_id", organizacaoId)
    .order("criado_em", { ascending: false })
    .range(inicio, inicio + tamanhoPagina - 1);

  if (busca?.trim()) query = query.ilike("nome_exibicao", `%${busca.trim()}%`);
  if (provedorId) query = query.eq("provedor_id", provedorId);
  if (statusFiltro) query = query.eq("status", statusFiltro);
  if (propriedadeId) {
    query = query.eq("filtro_propriedade.propriedade_id", propriedadeId).eq("filtro_propriedade.ativo", true);
  }

  const { data, error, status, count } = await query;
  if (error) throw withSupabaseStatus(error, status);
  return {
    itens: (data ?? []).map(normalizarConexao),
    total: count ?? 0,
    pagina,
    tamanhoPagina,
  };
}

export async function saveConexaoIntegracao(input: ConexaoIntegracaoSave): Promise<string> {
  const { data, error, status } = await supabase.rpc("salvar_conexao_integracao", {
    p_id: input.id ?? null,
    p_organizacao_id: input.organizacao_id,
    p_provedor_id: input.provedor_id,
    p_nome_exibicao: input.nome_exibicao,
    p_ambiente_execucao: input.ambiente_execucao,
    p_status: input.status,
    p_propriedade_ids: input.propriedade_ids,
  });
  if (error) throw withSupabaseStatus(error, status);
  return String(data);
}

export async function updateConexaoIntegracao({ id, ...payload }: ConexaoIntegracaoUpdate): Promise<void> {
  const { error, status } = await supabase.from("conexoes_integracao").update(payload).eq("id", id);
  if (error) throw withSupabaseStatus(error, status);
}

function normalizarConexao(row: Record<string, unknown>): ConexaoIntegracao {
  const { filtro_propriedade: _filtro, ...conexao } = row;
  return conexao as unknown as ConexaoIntegracao;
}
