import { supabase } from "../lib/supabase";
import { withSupabaseStatus } from "../lib/supabase-error";
import type { AdministradorPlataforma, Perfil } from "../types/database";

export async function getAdministradorAtual(perfilId: string): Promise<AdministradorPlataforma | null> {
  const { data, error, status } = await supabase.from("administradores_plataforma").select("*").eq("perfil_id", perfilId).maybeSingle();
  if (error) throw withSupabaseStatus(error, status);
  return data;
}

export async function listPerfis(ids: string[]): Promise<Perfil[]> {
  if (ids.length === 0) return [];
  const { data, error, status } = await supabase.from("perfis").select("*").in("id", ids);
  if (error) throw withSupabaseStatus(error, status);
  return data ?? [];
}
