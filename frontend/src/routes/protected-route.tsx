import { Navigate, Outlet, useLocation } from "react-router-dom";
import { RouteLoading } from "../components/feedback/route-loading";
import { useAuth } from "../contexts/auth-context";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <RouteLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
