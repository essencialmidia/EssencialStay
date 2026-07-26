import { supabase } from "../lib/supabase";
import { withSupabaseStatus } from "../lib/supabase-error";
import type { Dispositivo, EventoDispositivo, Pagina, StatusCadastroDispositivo } from "../types/database";

export type DispositivoCreate = {
  organizacao_id: string;
  propriedade_id: string;
  ambiente_id?: string | null;
  catalogo_id?: string | null;
  nome: string;
  fabricante?: string | null;
  modelo?: string | null;
  numero_serie?: string | null;
  versao_firmware?: string | null;
  status_cadastro?: StatusCadastroDispositivo;
  metadados?: Record<string, unknown>;
};

export type DispositivoUpdate = Partial<Omit<DispositivoCreate, "organizacao_id" | "propriedade_id">> & { id: string };

export type DispositivoListFilters = {
  organizacaoId: string;
  busca?: string;
  propriedadeId?: string;
  categoriaId?: string;
  status?: StatusCadastroDispositivo;
  pagina?: number;
  tamanhoPagina?: number;
};

export async function listDispositivos({ organizacaoId, busca, propriedadeId, categoriaId, status: statusFiltro, pagina = 1, tamanhoPagina = 25 }: DispositivoListFilters): Promise<Pagina<Dispositivo>> {
  const inicio = (pagina - 1) * tamanhoPagina;
  const select = categoriaId
    ? "*, ambiente:ambientes(nome), origens:origens_dispositivo(id), estado_atual:estados_dispositivo(*), catalogo_filtro:catalogo_dispositivos!inner(categoria_id)"
    : "*, ambiente:ambientes(nome), origens:origens_dispositivo(id), estado_atual:estados_dispositivo(*)";
  let query = supabase
    .from("dispositivos")
    .select(select as "*", { count: "exact" })
    .eq("organizacao_id", organizacaoId)
    .order("criado_em", { ascending: false })
    .range(inicio, inicio + tamanhoPagina - 1);

  if (busca?.trim()) {
    const termo = busca.trim();
    query = query.or(`nome.ilike.%${termo}%,fabricante.ilike.%${termo}%,modelo.ilike.%${termo}%,numero_serie.ilike.%${termo}%`);
  }
  if (propriedadeId) query = query.eq("propriedade_id", propriedadeId);
  if (categoriaId) query = query.eq("catalogo_filtro.categoria_id", categoriaId);
  if (statusFiltro) query = query.eq("status_cadastro", statusFiltro);

  const { data, error, status, count } = await query;
  if (error) throw withSupabaseStatus(error, status);
  return {
    itens: (data ?? []).map(normalizarDispositivo),
    total: count ?? 0,
    pagina,
    tamanhoPagina,
  };
}

export async function createDispositivo(payload: DispositivoCreate): Promise<Dispositivo> {
  const { data, error, status } = await supabase
    .from("dispositivos")
    .insert(payload)
    .select("*, ambiente:ambientes(nome), origens:origens_dispositivo(id), estado_atual:estados_dispositivo(*)")
    .single();
  if (error) throw withSupabaseStatus(error, status);
  return normalizarDispositivo(data as Record<string, unknown>);
}

export async function updateDispositivo({ id, ...payload }: DispositivoUpdate): Promise<Dispositivo> {
  const { data, error, status } = await supabase
    .from("dispositivos")
    .update(payload)
    .eq("id", id)
    .select("*, ambiente:ambientes(nome), origens:origens_dispositivo(id), estado_atual:estados_dispositivo(*)")
    .single();
  if (error) throw withSupabaseStatus(error, status);
  return normalizarDispositivo(data as Record<string, unknown>);
}

export async function listEventosDispositivo(dispositivoId: string, cursor?: number): Promise<EventoDispositivo[]> {
  let query = supabase
    .from("eventos_dispositivo")
    .select("*")
    .eq("dispositivo_id", dispositivoId)
    .order("id", { ascending: false })
    .limit(50);
  if (cursor !== undefined) query = query.lt("id", cursor);
  const { data, error, status } = await query;
  if (error) throw withSupabaseStatus(error, status);
  return data ?? [];
}

function normalizarDispositivo(row: Record<string, unknown>): Dispositivo {
  const { catalogo_filtro: _catalogoFiltro, estado_atual: estadoRaw, ...dispositivo } = row;
  const estado = Array.isArray(estadoRaw) ? estadoRaw[0] ?? null : estadoRaw ?? null;
  return { ...dispositivo, estado_atual: estado } as unknown as Dispositivo;
}
