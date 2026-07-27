import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getAdministradorAtual } from "../repositories/platform-admin.repository";
import type { AdministradorPlataforma } from "../types/database";
import { useAuth } from "./auth-context";

type PlatformAdminContextValue = {
  administrador: AdministradorPlataforma | null;
  isPlatformAdmin: boolean;
  canManagePlatform: boolean;
  loading: boolean;
};

const PlatformAdminContext = createContext<PlatformAdminContextValue | null>(null);

export function PlatformAdminProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [administrador, setAdministrador] = useState<AdministradorPlataforma | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (authLoading) {
      setLoading(true);
      return () => { active = false; };
    }
    if (!user) {
      setAdministrador(null);
      setLoading(false);
      return () => { active = false; };
    }
    setLoading(true);
    getAdministradorAtual(user.id)
      .then((data) => { if (active) setAdministrador(data?.ativo ? data : null); })
      .catch((error) => {
        console.error("[Admin] Falha ao validar administrador da plataforma", error);
        if (active) setAdministrador(null);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, user]);

  const value = useMemo(() => ({
    administrador,
    isPlatformAdmin: Boolean(administrador?.ativo),
    canManagePlatform: administrador?.papel === "proprietario" || administrador?.papel === "administrador",
    loading,
  }), [administrador, loading]);
  return <PlatformAdminContext.Provider value={value}>{children}</PlatformAdminContext.Provider>;
}

export function usePlatformAdmin() {
  const context = useContext(PlatformAdminContext);
  if (!context) throw new Error("usePlatformAdmin deve ser usado dentro de PlatformAdminProvider");
  return context;
}
