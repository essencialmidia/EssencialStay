import { useCallback, useEffect, useState } from "react";
import { obterResumoOperacional } from "../services/operacao.service";
import type { ResumoOperacional } from "../types/database";

const resumoVazio: ResumoOperacional = {
  total_unidades: 0,
  disponiveis: 0,
  reservadas: 0,
  preparando: 0,
  prontas_checkin: 0,
  ocupadas: 0,
  aguardando_limpeza: 0,
  em_limpeza: 0,
  manutencoes_impeditivas: 0,
  bloqueios_impeditivos: 0,
  tarefas_pendentes: 0,
};

export function useOperationalSummary(organizacaoId?: string, propriedadeId?: string) {
  const [data, setData] = useState<ResumoOperacional>(resumoVazio);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!organizacaoId) {
      setData(resumoVazio);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(await obterResumoOperacional(organizacaoId, propriedadeId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar o resumo operacional.");
    } finally {
      setLoading(false);
    }
  }, [organizacaoId, propriedadeId]);

  useEffect(() => { void load(); }, [load]);
  return { data, loading, error, reload: load };
}
