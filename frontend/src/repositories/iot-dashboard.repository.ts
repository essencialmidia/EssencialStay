import { supabase } from "../lib/supabase";
import { withSupabaseStatus } from "../lib/supabase-error";

export type ResumoIot = {
  conexoesAtivas: number;
  conexoesTotal: number;
  dispositivosAtivos: number;
  dispositivosTotal: number;
  ambientesAtivos: number;
  ambientesTotal: number;
  dispositivosOffline: number;
};

export async function getResumoIot(organizacaoId: string): Promise<ResumoIot> {
  const results = await Promise.all([
    supabase.from("conexoes_integracao").select("id", { count: "exact", head: true }).eq("organizacao_id", organizacaoId).eq("status", "conectada"),
    supabase.from("conexoes_integracao").select("id", { count: "exact", head: true }).eq("organizacao_id", organizacaoId),
    supabase.from("dispositivos").select("id", { count: "exact", head: true }).eq("organizacao_id", organizacaoId).neq("status_cadastro", "inativo"),
    supabase.from("dispositivos").select("id", { count: "exact", head: true }).eq("organizacao_id", organizacaoId),
    supabase.from("ambientes").select("id", { count: "exact", head: true }).eq("organizacao_id", organizacaoId).eq("ativo", true),
    supabase.from("ambientes").select("id", { count: "exact", head: true }).eq("organizacao_id", organizacaoId),
    supabase.from("estados_dispositivo").select("dispositivo:dispositivos!inner(id)", { count: "exact", head: true }).eq("organizacao_id", organizacaoId).eq("online", false).neq("dispositivo.status_cadastro", "inativo"),
  ]);

  for (const result of results) {
    if (result.error) throw withSupabaseStatus(result.error, result.status);
  }

  return {
    conexoesAtivas: results[0].count ?? 0,
    conexoesTotal: results[1].count ?? 0,
    dispositivosAtivos: results[2].count ?? 0,
    dispositivosTotal: results[3].count ?? 0,
    ambientesAtivos: results[4].count ?? 0,
    ambientesTotal: results[5].count ?? 0,
    dispositivosOffline: results[6].count ?? 0,
  };
}
