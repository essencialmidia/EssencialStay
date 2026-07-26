import { useCallback, useEffect, useRef, useState } from "react";

export type CursorPage<T, C> = {
  itens: T[];
  proximoCursor: C | null;
};

export function useCursorPaginatedQuery<T, C>(
  load: (cursor: C | null) => Promise<CursorPage<T, C>>,
  resetKey: string,
) {
  const [cursors, setCursors] = useState<Array<C | null>>([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const [data, setData] = useState<CursorPage<T, C>>({ itens: [], proximoCursor: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetVersion, setResetVersion] = useState(0);
  const requestId = useRef(0);
  const resetKeyRef = useRef(resetKey);
  const cursor = cursors[pageIndex] ?? null;

  const reload = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await load(cursor);
      if (currentRequest === requestId.current) setData(result);
    } catch (loadError) {
      if (currentRequest === requestId.current) {
        setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar os dados.");
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [cursor, load, resetVersion]);

  const reset = useCallback(() => {
    requestId.current += 1;
    setCursors([null]);
    setPageIndex(0);
    setResetVersion((current) => current + 1);
  }, []);

  const nextPage = useCallback(() => {
    if (!data.proximoCursor) return;
    setCursors((current) => [
      ...current.slice(0, pageIndex + 1),
      data.proximoCursor,
    ]);
    setPageIndex((current) => current + 1);
  }, [data.proximoCursor, pageIndex]);

  const previousPage = useCallback(() => {
    setPageIndex((current) => Math.max(0, current - 1));
  }, []);

  useEffect(() => {
    if (resetKeyRef.current === resetKey) return;
    resetKeyRef.current = resetKey;
    reset();
  }, [reset, resetKey]);
  useEffect(() => {
    void reload();
    return () => { requestId.current += 1; };
  }, [reload]);

  return {
    data,
    loading,
    error,
    pagina: pageIndex + 1,
    temAnterior: pageIndex > 0,
    temProxima: Boolean(data.proximoCursor),
    nextPage,
    previousPage,
    reload,
    reset,
  };
}
