import { supabase } from "../lib/supabase";
import { withSupabaseStatus } from "../lib/supabase-error";
import type { CatalogoDispositivo, CategoriaDispositivo, ProtocoloDispositivo, ProvedorIntegracao } from "../types/database";

export async function listProvedoresIntegracao(): Promise<ProvedorIntegracao[]> {
  const { data, error, status } = await supabase
    .from("provedores_integracao")
    .select("*")
    .eq("ativo", true)
    .order("nome");
  if (error) throw withSupabaseStatus(error, status);
  return data ?? [];
}

export async function listCategoriasDispositivo(): Promise<CategoriaDispositivo[]> {
  const { data, error, status } = await supabase
    .from("categorias_dispositivo")
    .select("*")
    .eq("ativo", true)
    .order("nome");
  if (error) throw withSupabaseStatus(error, status);
  return data ?? [];
}

export async function listProtocolosDispositivo(): Promise<ProtocoloDispositivo[]> {
  const { data, error, status } = await supabase
    .from("protocolos_dispositivo")
    .select("*")
    .eq("ativo", true)
    .order("nome");
  if (error) throw withSupabaseStatus(error, status);
  return data ?? [];
}

export async function listCatalogoDispositivos(): Promise<CatalogoDispositivo[]> {
  const { data, error, status } = await supabase
    .from("catalogo_dispositivos")
    .select(`
      *,
      categoria:categorias_dispositivo(*),
      protocolos:catalogo_dispositivo_protocolos(
        principal,
        protocolo:protocolos_dispositivo(*)
      )
    `)
    .order("fabricante")
    .order("modelo")
    .limit(500);
  if (error) throw withSupabaseStatus(error, status);
  return (data ?? []) as unknown as CatalogoDispositivo[];
}
