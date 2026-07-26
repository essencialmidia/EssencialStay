import { Navigate, Outlet } from "react-router-dom";
import { RouteLoading } from "../components/feedback/route-loading";
import { useAuth } from "../contexts/auth-context";

export function PublicRoute() {
  const { user, loading } = useAuth();

  if (loading) return <RouteLoading />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
