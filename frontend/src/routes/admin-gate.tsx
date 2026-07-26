import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LoadingState } from "../components/feedback/loading-state";
import { usePlatformAdmin } from "../contexts/platform-admin-context";

export function AdminGate() {
  const { isPlatformAdmin, loading } = usePlatformAdmin();
  const location = useLocation();
  if (loading) return <LoadingState label="Validando acesso administrativo" />;
  if (!isPlatformAdmin) return <Navigate to="/403" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
