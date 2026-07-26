import { supabase } from "../lib/supabase";
import { withSupabaseStatus } from "../lib/supabase-error";
import type { Perfil } from "../types/database";

export type PerfilUpsert = {
  id: string;
  nome_completo?: string | null;
  telefone?: string | null;
  avatar_url?: string | null;
};

export async function getPerfil(id: string): Promise<Perfil | null> {
  const { data, error, status } = await supabase.from("perfis").select("*").eq("id", id).maybeSingle();
  if (error) throw withSupabaseStatus(error, status);
  return data;
}

export async function upsertPerfil(payload: PerfilUpsert): Promise<Perfil> {
  const { data, error, status } = await supabase.from("perfis").upsert(payload).select("*").single();
  if (error) {
    console.error("[Supabase] Falha em public.perfis", {
      operacao: "upsert",
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      status,
    });
    throw withSupabaseStatus(error, status);
  }
  return data;
}
