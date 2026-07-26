import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as authRepository from "../repositories/auth.repository";
import { ensurePerfil } from "../services/auth.service";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  refreshSession: () => Promise<Session | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function synchronizePerfil(session: Session | null) {
  if (!session?.user) return;
  const nomeCompleto = typeof session.user.user_metadata.nome_completo === "string" ? session.user.user_metadata.nome_completo : null;
  void ensurePerfil(session.user.id, nomeCompleto).catch(() => {
    // A sessão de autenticação não deve ser invalidada por uma falha de sincronização do perfil.
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const nextSession = await authRepository.getSession();
    setSession(nextSession);
    synchronizePerfil(nextSession);
    return nextSession;
  }, []);

  useEffect(() => {
    let active = true;

    authRepository.getSession()
      .then((currentSession) => {
        if (!active) return;
        setSession(currentSession);
        synchronizePerfil(currentSession);
      })
      .catch(() => {
        if (active) setSession(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const { data } = authRepository.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setLoading(false);
      synchronizePerfil(nextSession);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({ session, user: session?.user ?? null, loading, refreshSession }),
    [loading, refreshSession, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}
