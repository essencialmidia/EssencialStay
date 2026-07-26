import { useCallback, useEffect, useState } from "react";
import { carregarResumoIot, type ResumoIot } from "../services/iot-dashboard.service";

const emptySummary: ResumoIot = {
  conexoesAtivas: 0,
  conexoesTotal: 0,
  dispositivosAtivos: 0,
  dispositivosTotal: 0,
  ambientesAtivos: 0,
  ambientesTotal: 0,
  dispositivosOffline: 0,
};

export function useIotDashboardSummary(organizacaoId?: string) {
  const [data, setData] = useState(emptySummary);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!organizacaoId) {
      setData(emptySummary);
      return;
    }
    try {
      setError(null);
      setData(await carregarResumoIot(organizacaoId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar os indicadores de IoT.");
    }
  }, [organizacaoId]);

  useEffect(() => { void reload(); }, [reload]);
  return { data, error, reload };
}
