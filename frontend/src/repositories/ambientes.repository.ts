import { supabase } from "../lib/supabase";
import { withSupabaseStatus } from "../lib/supabase-error";
import type { Ambiente, Pagina } from "../types/database";

export type AmbienteCreate = {
  organizacao_id: string;
  propriedade_id: string;
  unidade_id?: string | null;
  ambiente_pai_id?: string | null;
  nome: string;
  descricao?: string | null;
  ativo?: boolean;
};

export type AmbienteUpdate = Partial<Omit<AmbienteCreate, "organizacao_id" | "propriedade_id">> & { id: string };

export type AmbienteListFilters = {
  organizacaoId: string;
  busca?: string;
  propriedadeId?: string;
  ativo?: boolean;
  pagina?: number;
  tamanhoPagina?: number;
};

export async function listAmbientes({ organizacaoId, busca, propriedadeId, ativo, pagina = 1, tamanhoPagina = 25 }: AmbienteListFilters): Promise<Pagina<Ambiente>> {
  const inicio = (pagina - 1) * tamanhoPagina;
  let query = supabase
    .from("ambientes")
    .select("*", { count: "exact" })
    .eq("organizacao_id", organizacaoId)
    .order("nome")
    .range(inicio, inicio + tamanhoPagina - 1);

  if (busca?.trim()) query = query.ilike("nome", `%${busca.trim()}%`);
  if (propriedadeId) query = query.eq("propriedade_id", propriedadeId);
  if (ativo !== undefined) query = query.eq("ativo", ativo);

  const { data, error, status, count } = await query;
  if (error) throw withSupabaseStatus(error, status);
  return { itens: data ?? [], total: count ?? 0, pagina, tamanhoPagina };
}

export async function listAmbienteOptions(organizacaoId: string, propriedadeId: string): Promise<Ambiente[]> {
  const { data, error, status } = await supabase
    .from("ambientes")
    .select("*")
    .eq("organizacao_id", organizacaoId)
    .eq("propriedade_id", propriedadeId)
    .eq("ativo", true)
    .order("nome")
    .limit(250);
  if (error) throw withSupabaseStatus(error, status);
  return data ?? [];
}

export async function createAmbiente(payload: AmbienteCreate): Promise<Ambiente> {
  const { data, error, status } = await supabase.from("ambientes").insert(payload).select("*").single();
  if (error) throw withSupabaseStatus(error, status);
  return data;
}

export async function updateAmbiente({ id, ...payload }: AmbienteUpdate): Promise<Ambiente> {
  const { data, error, status } = await supabase.from("ambientes").update(payload).eq("id", id).select("*").single();
  if (error) throw withSupabaseStatus(error, status);
  return data;
}
