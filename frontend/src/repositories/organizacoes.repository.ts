import { supabase } from "../lib/supabase";
import { withSupabaseStatus } from "../lib/supabase-error";
import type { MembroOrganizacao, Organizacao, StatusOrganizacao, TipoOrganizacao } from "../types/database";

export type OrganizacaoCreate = {
  nome: string;
  nome_fantasia?: string | null;
  documento?: string | null;
  tipo: TipoOrganizacao;
  email?: string | null;
  telefone?: string | null;
  logo_url?: string | null;
  status?: StatusOrganizacao;
};

export type OrganizacaoUpdate = Partial<OrganizacaoCreate> & { id: string };

export async function listOrganizacoes(): Promise<Organizacao[]> {
  const { data, error, status } = await supabase.from("organizacoes").select("*").order("criado_em", { ascending: false });
  if (error) throw withSupabaseStatus(error, status);
  return data ?? [];
}

export async function getOrganizacao(id: string): Promise<Organizacao | null> {
  const { data, error, status } = await supabase.from("organizacoes").select("*").eq("id", id).maybeSingle();
  if (error) throw withSupabaseStatus(error, status);
  return data;
}

export async function createOrganizacao(payload: OrganizacaoCreate): Promise<Organizacao> {
  const { data, error, status } = await supabase.from("organizacoes").insert(payload).select("*").single();
  if (error) throw withSupabaseStatus(error, status);
  return data;
}

export async function updateOrganizacao({ id, ...payload }: OrganizacaoUpdate): Promise<Organizacao> {
  const { data, error, status } = await supabase.from("organizacoes").update(payload).eq("id", id).select("*").single();
  if (error) throw withSupabaseStatus(error, status);
  return data;
}

export async function criarOrganizacaoOnboarding(payload: OrganizacaoCreate): Promise<Organizacao> {
  const { data, error, status } = await supabase.rpc("criar_organizacao_onboarding", {
    p_documento: payload.documento ?? null,
    p_email: payload.email ?? null,
    p_logo_url: payload.logo_url ?? null,
    p_nome: payload.nome,
    p_nome_fantasia: payload.nome_fantasia ?? null,
    p_telefone: payload.telefone ?? null,
    p_tipo: payload.tipo,
  }).single();
  if (error) throw withSupabaseStatus(error, status);
  const organizacao = await getOrganizacao((data as { id: string }).id);
  if (!organizacao) throw new Error("Empresa criada, mas não localizada após o onboarding.");
  return organizacao;
}

export async function listMembrosOrganizacao(organizacaoId?: string): Promise<MembroOrganizacao[]> {
  let query = supabase.from("membros_organizacao").select("*").order("criado_em", { ascending: true });
  if (organizacaoId) query = query.eq("organizacao_id", organizacaoId);
  const { data, error, status } = await query;
  if (error) throw withSupabaseStatus(error, status);
  return data ?? [];
}

export async function getMembroOrganizacao(organizacaoId: string, perfilId: string): Promise<MembroOrganizacao | null> {
  const { data, error, status } = await supabase.from("membros_organizacao").select("*").eq("organizacao_id", organizacaoId).eq("perfil_id", perfilId).maybeSingle();
  if (error) throw withSupabaseStatus(error, status);
  return data;
}
