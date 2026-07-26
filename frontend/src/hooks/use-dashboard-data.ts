import { useCallback, useEffect, useState } from "react";
import { listarAutomacoes, type AutomacaoComRecursos } from "../services/automacao.service";
import { listarPropriedades } from "../services/propriedades.service";
import { listarUnidades } from "../services/unidades.service";
import type { Propriedade, Unidade } from "../types/database";

export type DashboardData = {
  propriedades: Propriedade[];
  unidades: Unidade[];
  automacoes: AutomacaoComRecursos[];
};

const emptyData: DashboardData = { propriedades: [], unidades: [], automacoes: [] };

export function useDashboardData(organizacaoId?: string) {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!organizacaoId) {
      setData(emptyData);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const propriedades = await listarPropriedades([organizacaoId]);
      const propriedadeIds = propriedades.map((item) => item.id);
      const [unidades, automacoes] = await Promise.all([
        listarUnidades(propriedadeIds),
        listarAutomacoes(propriedadeIds),
      ]);
      setData({ propriedades, unidades, automacoes });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  }, [organizacaoId]);

  useEffect(() => { void load(); }, [load]);
  return { data, loading, error, reload: load };
}
