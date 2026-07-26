import { Home } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/auth-context";
import { Button } from "../ui/button";
import { Tooltip } from "../ui/tooltip";

export function GlobalHomeButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();

  return (
    <>
      <Outlet />
      {!location.pathname.startsWith("/demo/29-07") && location.pathname !== "/s/hotel-monaco-demo" && <div className="fixed bottom-5 right-5 z-[55] sm:bottom-6 sm:right-6">
        <Tooltip content="Voltar para a tela principal" side="top">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11 bg-card shadow-floating"
            disabled={loading}
            onClick={() => navigate(user ? "/dashboard" : "/login")}
            aria-label="Voltar para a tela principal"
          >
            <Home className="size-4.5" aria-hidden="true" />
          </Button>
        </Tooltip>
      </div>}
    </>
  );
}
