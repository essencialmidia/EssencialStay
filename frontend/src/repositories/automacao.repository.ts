import { supabase } from "../lib/supabase";
import { withSupabaseStatus } from "../lib/supabase-error";
import type { ConfiguracaoAutomacaoPropriedade, InstaladorAutomacao, MarcaAutomacao, RecursoAutomacao, RecursoAutomacaoPropriedade, StatusAutomacao, StatusInstalacaoAutomacao } from "../types/database";

export type ConfiguracaoAutomacaoInput = {
  propriedade_id: string;
  possui_automacao: StatusAutomacao;
  marca: MarcaAutomacao;
  marca_outro?: string | null;
  modelo?: string | null;
  situacao_instalacao?: StatusInstalacaoAutomacao | null;
  instalador_responsavel: InstaladorAutomacao;
  instalador_outro?: string | null;
  recursos: RecursoAutomacao[];
};

export async function listConfiguracoes(propriedadeIds?: string[]): Promise<ConfiguracaoAutomacaoPropriedade[]> {
  if (propriedadeIds && propriedadeIds.length === 0) return [];
  let query = supabase.from("configuracoes_automacao_propriedade").select("*").order("criado_em", { ascending: true });
  if (propriedadeIds) query = query.in("propriedade_id", propriedadeIds);
  const { data, error, status } = await query;
  if (error) throw withSupabaseStatus(error, status);
  return data ?? [];
}

export async function getConfiguracao(propriedadeId: string): Promise<ConfiguracaoAutomacaoPropriedade | null> {
  const { data, error, status } = await supabase.from("configuracoes_automacao_propriedade").select("*").eq("propriedade_id", propriedadeId).maybeSingle();
  if (error) throw withSupabaseStatus(error, status);
  return data;
}

export async function listRecursos(configuracaoIds: string[]): Promise<RecursoAutomacaoPropriedade[]> {
  if (configuracaoIds.length === 0) return [];
  const { data, error, status } = await supabase.from("recursos_automacao_propriedade").select("*").in("configuracao_id", configuracaoIds).order("recurso");
  if (error) throw withSupabaseStatus(error, status);
  return data ?? [];
}

export async function saveConfiguracao({ recursos, ...payload }: ConfiguracaoAutomacaoInput): Promise<ConfiguracaoAutomacaoPropriedade> {
  const { data, error, status } = await supabase.from("configuracoes_automacao_propriedade").upsert(payload, { onConflict: "propriedade_id" }).select("*").single();
  if (error) throw withSupabaseStatus(error, status);

  const { error: deleteError, status: deleteStatus } = await supabase.from("recursos_automacao_propriedade").delete().eq("configuracao_id", data.id);
  if (deleteError) throw withSupabaseStatus(deleteError, deleteStatus);
  if (recursos.length > 0) {
    const { error: insertError, status: insertStatus } = await supabase.from("recursos_automacao_propriedade").insert(recursos.map((recurso) => ({ configuracao_id: data.id, recurso })));
    if (insertError) throw withSupabaseStatus(insertError, insertStatus);
  }
  return data;
}
