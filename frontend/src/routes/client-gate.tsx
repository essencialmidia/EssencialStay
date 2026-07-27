import { Navigate, Outlet } from "react-router-dom";
import { LoadingState } from "../components/feedback/loading-state";
import { useOrganization } from "../contexts/organization-context";
import { usePlatformAdmin } from "../contexts/platform-admin-context";

export function OrganizationGate() {
  const { organizacoes, loading } = useOrganization();
  const { isPlatformAdmin, loading: adminLoading } = usePlatformAdmin();
  if (loading || adminLoading) return <LoadingState label="Validando acesso" />;
  if (isPlatformAdmin) return <Navigate to="/admin" replace />;
  if (organizacoes.length === 0) {
    return <Navigate to="/onboarding" replace />;
  }
  return <Outlet />;
}

export const ClientGate = OrganizationGate;
