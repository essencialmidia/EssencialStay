import { useCallback, useEffect, useState } from "react";
import { listPerfis } from "../repositories/platform-admin.repository";
import { listarAutomacoes, type AutomacaoComRecursos } from "../services/automacao.service";
import { listarMembrosOrganizacao, listarOrganizacoes } from "../services/organizacoes.service";
import { listarPropriedades } from "../services/propriedades.service";
import { listarUnidades } from "../services/unidades.service";
import type { MembroOrganizacao, Organizacao, Perfil, Propriedade, Unidade } from "../types/database";

export type PlatformData = { organizacoes: Organizacao[]; propriedades: Propriedade[]; unidades: Unidade[]; membros: MembroOrganizacao[]; perfis: Perfil[]; automacoes: AutomacaoComRecursos[] };
const emptyData: PlatformData = { organizacoes: [], propriedades: [], unidades: [], membros: [], perfis: [], automacoes: [] };

export function usePlatformData() {
  const [data, setData] = useState<PlatformData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [organizacoes, propriedades, membros] = await Promise.all([listarOrganizacoes(), listarPropriedades(), listarMembrosOrganizacao()]);
      const [unidades, automacoes, perfis] = await Promise.all([
        listarUnidades(propriedades.map((item) => item.id)), listarAutomacoes(propriedades.map((item) => item.id)), listPerfis([...new Set(membros.map((item) => item.perfil_id))]),
      ]);
      setData({ organizacoes, propriedades, membros, perfis, unidades, automacoes });
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar a administração."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  return { data, loading, error, reload: load };
}
