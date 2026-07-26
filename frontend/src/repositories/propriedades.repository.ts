import { supabase } from "../lib/supabase";
import { withSupabaseStatus } from "../lib/supabase-error";
import type { FusoHorario, Propriedade, StatusPropriedade, TipoPropriedade } from "../types/database";

export type PropriedadeCreate = {
  organizacao_id: string;
  nome: string;
  nome_fantasia?: string | null;
  documento?: string | null;
  tipo: TipoPropriedade;
  descricao?: string | null;
  endereco?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  pais?: string;
  fuso_horario?: string;
  horario_checkin?: string | null;
  horario_checkout?: string | null;
  wifi_nome?: string | null;
  wifi_senha?: string | null;
  status?: StatusPropriedade;
};

export type PropriedadeUpdate = Partial<Omit<PropriedadeCreate, "organizacao_id">> & { id: string };

export async function listPropriedades(organizacaoIds?: string[]): Promise<Propriedade[]> {
  if (organizacaoIds && organizacaoIds.length === 0) return [];
  let query = supabase.from("propriedades").select("*").order("criado_em", { ascending: false });
  if (organizacaoIds) query = query.in("organizacao_id", organizacaoIds);
  const { data, error, status } = await query;
  if (error) throw withSupabaseStatus(error, status);
  return data ?? [];
}

export async function getPropriedade(id: string): Promise<Propriedade | null> {
  const { data, error, status } = await supabase.from("propriedades").select("*").eq("id", id).maybeSingle();
  if (error) throw withSupabaseStatus(error, status);
  return data;
}

export async function createPropriedade(payload: PropriedadeCreate): Promise<Propriedade> {
  const { data, error, status } = await supabase.from("propriedades").insert(payload).select("*").single();
  if (error) throw withSupabaseStatus(error, status);
  return data;
}

export async function updatePropriedade({ id, ...payload }: PropriedadeUpdate): Promise<Propriedade> {
  const { data, error, status } = await supabase.from("propriedades").update(payload).eq("id", id).select("*").single();
  if (error) throw withSupabaseStatus(error, status);
  return data;
}

export async function findPropriedadeOnboarding(organizacaoId: string, nome: string): Promise<Propriedade | null> {
  const { data, error, status } = await supabase.from("propriedades").select("*").eq("organizacao_id", organizacaoId).eq("nome", nome.trim()).order("criado_em", { ascending: true }).limit(1).maybeSingle();
  if (error) throw withSupabaseStatus(error, status);
  return data;
}

export async function listFusosHorarios(): Promise<FusoHorario[]> {
  const { data, error, status } = await supabase.rpc("listar_fusos_horarios");
  if (error) throw withSupabaseStatus(error, status);
  return data ?? [];
}
