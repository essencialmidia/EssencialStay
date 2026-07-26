import { useCallback, useEffect, useRef, useState } from "react";
import type { Pagina } from "../types/database";

const emptyPage = <T,>(): Pagina<T> => ({ itens: [], total: 0, pagina: 1, tamanhoPagina: 25 });

export function usePaginatedQuery<T>(load: () => Promise<Pagina<T>>) {
  const [data, setData] = useState<Pagina<T>>(emptyPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await load();
      if (currentRequest === requestId.current) setData(result);
    } catch (loadError) {
      if (currentRequest === requestId.current) {
        setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar os dados.");
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    void reload();
    return () => { requestId.current += 1; };
  }, [reload]);

  return { data, loading, error, reload };
}
