import { ShieldX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../components/feedback/empty-state";
import { Button } from "../components/ui/button";

export function ForbiddenPage() {
  const navigate = useNavigate();
  return <main className="grid min-h-screen place-items-center bg-background p-6"><div className="w-full max-w-xl"><EmptyState title="Acesso não autorizado" description="Esta área é restrita aos administradores ativos da plataforma Essencial Stay." icon={ShieldX} action={<Button onClick={() => navigate("/dashboard", { replace: true })}>Voltar à operação</Button>} /></div></main>;
}
