import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { listarOrganizacoes } from "../services/organizacoes.service";
import type { Organizacao } from "../types/database";
import { useAuth } from "./auth-context";

type OrganizationContextValue = {
  organizacoes: Organizacao[];
  organizacoesAtivas: Organizacao[];
  organizacaoAtual: Organizacao | null;
  loading: boolean;
  setOrganizacaoAtualId: (id: string) => void;
  reloadOrganizacoes: (preferredId?: string) => Promise<void>;
};

const OrganizationContext = createContext<OrganizationContextValue | null>(null);
const storageKey = "essencial-stay-organizacao";

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [organizacoes, setOrganizacoes] = useState<Organizacao[]>([]);
  const [organizacaoAtualId, setOrganizacaoAtualIdState] = useState<string | null>(() => localStorage.getItem(storageKey));
  const [loading, setLoading] = useState(false);

  const reloadOrganizacoes = useCallback(async (preferredId?: string) => {
    if (!user) {
      setOrganizacoes([]);
      setOrganizacaoAtualIdState(null);
      return;
    }
    setLoading(true);
    try {
      const data = await listarOrganizacoes();
      setOrganizacoes(data);
      const ativas = data.filter((item) => item.status === "ativo");
      const nextId = ativas.some((item) => item.id === preferredId)
        ? preferredId
        : ativas.some((item) => item.id === organizacaoAtualId)
          ? organizacaoAtualId
          : ativas[0]?.id;
      setOrganizacaoAtualIdState(nextId ?? null);
      if (nextId) localStorage.setItem(storageKey, nextId);
      else localStorage.removeItem(storageKey);
    } finally {
      setLoading(false);
    }
  }, [organizacaoAtualId, user]);

  useEffect(() => { void reloadOrganizacoes(); }, [reloadOrganizacoes]);

  const setOrganizacaoAtualId = useCallback((id: string) => {
    setOrganizacaoAtualIdState(id);
    localStorage.setItem(storageKey, id);
  }, []);

  const organizacoesAtivas = useMemo(() => organizacoes.filter((item) => item.status === "ativo"), [organizacoes]);
  const organizacaoAtual = useMemo(
    () => organizacoesAtivas.find((item) => item.id === organizacaoAtualId) ?? organizacoesAtivas[0] ?? null,
    [organizacaoAtualId, organizacoesAtivas],
  );

  const value = useMemo(() => ({ organizacoes, organizacoesAtivas, organizacaoAtual, loading, setOrganizacaoAtualId, reloadOrganizacoes }), [loading, organizacaoAtual, organizacoes, organizacoesAtivas, reloadOrganizacoes, setOrganizacaoAtualId]);
  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) throw new Error("useOrganization deve ser usado dentro de OrganizationProvider");
  return context;
}
