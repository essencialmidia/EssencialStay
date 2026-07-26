import { supabase } from "../lib/supabase";
import { withSupabaseStatus } from "../lib/supabase-error";
import { normalizarTipoUnidade, type TipoUnidade, type Unidade } from "../types/database";

export type UnidadeCreate = {
  propriedade_id: string;
  nome: string;
  codigo?: string | null;
  tipo: TipoUnidade;
  andar?: string | null;
  numero_identificacao?: string | null;
  capacidade_hospedes?: number | null;
  ativo?: boolean;
};

export type UnidadeUpdate = Partial<Omit<UnidadeCreate, "propriedade_id">> & {
  id: string;
};

export async function listUnidadesByPropriedades(propriedadeIds: string[]): Promise<Unidade[]> {
  if (propriedadeIds.length === 0) return [];
  const { data, error, status } = await supabase
    .from("unidades")
    .select("*")
    .in("propriedade_id", propriedadeIds)
    .order("criado_em", { ascending: true });
  if (error) throw withSupabaseStatus(error, status);
  return data ?? [];
}

export async function getUnidade(id: string): Promise<Unidade | null> {
  const { data, error, status } = await supabase.from("unidades").select("*").eq("id", id).maybeSingle();
  if (error) throw withSupabaseStatus(error, status);
  return data;
}

export async function createUnidade(payload: UnidadeCreate): Promise<Unidade> {
  const normalizedPayload = {
    ...payload,
    codigo: normalizarCodigo(payload.codigo),
    tipo: normalizarTipoUnidade(payload.tipo),
  };
  const { data, error, status } = await supabase.from("unidades").insert(normalizedPayload).select("*").single();
  if (error) throw withSupabaseStatus(error, status);
  return data;
}

export async function updateUnidade({ id, ...payload }: UnidadeUpdate): Promise<Unidade> {
  const normalizedPayload = {
    ...payload,
    ...(payload.codigo !== undefined ? { codigo: normalizarCodigo(payload.codigo) } : {}),
    ...(payload.tipo ? { tipo: normalizarTipoUnidade(payload.tipo) } : {}),
  };
  const { data, error, status } = await supabase.from("unidades").update(normalizedPayload).eq("id", id).select("*").single();
  if (error) throw withSupabaseStatus(error, status);
  return data;
}

export async function findUnidadeOnboarding(propriedadeId: string, nome: string, codigo?: string | null): Promise<Unidade | null> {
  const unidades = await listUnidadesByPropriedades([propriedadeId]);
  const codigoNormalizado = codigo?.trim().toLocaleLowerCase("pt-BR");
  const nomeNormalizado = nome.trim().toLocaleLowerCase("pt-BR");
  return unidades.find((unidade) => {
    if (codigoNormalizado) return unidade.codigo?.trim().toLocaleLowerCase("pt-BR") === codigoNormalizado;
    return unidade.nome.trim().toLocaleLowerCase("pt-BR") === nomeNormalizado;
  }) ?? null;
}

export type CriarUnidadesEmLoteInput = {
  propriedade_id: string;
  prefixo?: string | null;
  numero_inicial: number;
  numero_final: number;
  tipo: TipoUnidade;
  capacidade_hospedes: number;
  andar?: string | null;
};

export type CriarUnidadesEmLoteResult = {
  criadas: number;
  ignoradas: number;
};

export async function createUnidadesEmLote(input: CriarUnidadesEmLoteInput): Promise<CriarUnidadesEmLoteResult> {
  const { data, error, status } = await supabase.rpc("criar_unidades_em_lote", {
    p_propriedade_id: input.propriedade_id,
    p_prefixo: input.prefixo?.trim() || null,
    p_numero_inicial: input.numero_inicial,
    p_numero_final: input.numero_final,
    p_tipo: normalizarTipoUnidade(input.tipo),
    p_capacidade_hospedes: input.capacidade_hospedes,
    p_andar: input.andar?.trim() || null,
  });
  if (error) throw withSupabaseStatus(error, status);
  const result = Array.isArray(data) ? data[0] : data;
  return { criadas: Number(result?.criadas ?? 0), ignoradas: Number(result?.ignoradas ?? 0) };
}

function normalizarCodigo(value?: string | null) {
  return value?.trim() ? value.trim().toLocaleUpperCase("pt-BR") : null;
}
