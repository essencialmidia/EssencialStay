import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LoadingState } from "../components/feedback/loading-state";
import { useOrganization } from "../contexts/organization-context";

export function OrganizationGate() {
  const { organizacoes, loading } = useOrganization();
  const location = useLocation();

  if (loading) return <LoadingState label="Carregando empresa" />;
  if (organizacoes.length === 0 && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }
  return <Outlet />;
}

export const ClientGate = OrganizationGate;
