import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { listarOrganizacoes } from "../services/organizacoes.service";
import type { Organizacao } from "../types/database";
import { useAuth } from "./auth-context";
import { usePlatformAdmin } from "./platform-admin-context";

type OrganizationContextValue = {
  organizacoes: Organizacao[];
  organizacoesAtivas: Organizacao[];
  organizacaoAtual: Organizacao | null;
  organizacaoAdministrativa: Organizacao | null;
  loading: boolean;
  setOrganizacaoAtualId: (id: string) => void;
  selecionarOrganizacaoAdministrativa: (id: string) => boolean;
  limparOrganizacaoAdministrativa: () => void;
  reloadOrganizacoes: (preferredId?: string) => Promise<void>;
};

const OrganizationContext = createContext<OrganizationContextValue | null>(null);
const storageKey = "essencial-stay-organizacao";

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isPlatformAdmin } = usePlatformAdmin();
  const [organizacoes, setOrganizacoes] = useState<Organizacao[]>([]);
  const [organizacaoAtualId, setOrganizacaoAtualIdState] = useState<string | null>(() => localStorage.getItem(storageKey));
  const [organizacaoAdministrativaId, setOrganizacaoAdministrativaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reloadOrganizacoes = useCallback(async (preferredId?: string) => {
    if (!user) {
      setOrganizacoes([]);
      setOrganizacaoAtualIdState(null);
      setOrganizacaoAdministrativaId(null);
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

  const selecionarOrganizacaoAdministrativa = useCallback((id: string) => {
    if (!isPlatformAdmin || !organizacoes.some((item) => item.id === id)) return false;
    setOrganizacaoAdministrativaId(id);
    return true;
  }, [isPlatformAdmin, organizacoes]);

  const limparOrganizacaoAdministrativa = useCallback(() => setOrganizacaoAdministrativaId(null), []);

  const organizacoesAtivas = useMemo(() => organizacoes.filter((item) => item.status === "ativo"), [organizacoes]);
  const organizacaoAdministrativa = useMemo(
    () => isPlatformAdmin ? organizacoesAtivas.find((item) => item.id === organizacaoAdministrativaId) ?? null : null,
    [isPlatformAdmin, organizacaoAdministrativaId, organizacoesAtivas],
  );
  const organizacaoAtual = useMemo(
    () => organizacaoAdministrativa ?? organizacoesAtivas.find((item) => item.id === organizacaoAtualId) ?? organizacoesAtivas[0] ?? null,
    [organizacaoAdministrativa, organizacaoAtualId, organizacoesAtivas],
  );

  const value = useMemo(() => ({ organizacoes, organizacoesAtivas, organizacaoAtual, organizacaoAdministrativa, loading, setOrganizacaoAtualId, selecionarOrganizacaoAdministrativa, limparOrganizacaoAdministrativa, reloadOrganizacoes }), [limparOrganizacaoAdministrativa, loading, organizacaoAdministrativa, organizacaoAtual, organizacoes, organizacoesAtivas, reloadOrganizacoes, selecionarOrganizacaoAdministrativa, setOrganizacaoAtualId]);
  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) throw new Error("useOrganization deve ser usado dentro de OrganizationProvider");
  return context;
}
