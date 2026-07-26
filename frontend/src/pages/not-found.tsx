import { Link } from "react-router-dom";
import { SearchX } from "lucide-react";
import { EmptyState } from "../components/feedback/empty-state";

export function NotFoundPage() {
  return (
    <div className="grid min-h-[calc(100vh-8rem)] place-items-center">
      <div className="w-full max-w-2xl space-y-5">
        <EmptyState
          icon={SearchX}
          title="Pagina nao encontrada"
          description="A rota solicitada nao existe na shell atual do Essencial Stay."
          label="404"
        />
        <div className="flex justify-center">
          <Link
            to="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Voltar ao dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
