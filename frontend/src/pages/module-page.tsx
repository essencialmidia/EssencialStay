import type { LucideIcon } from "lucide-react";
import { ArrowLeft, CheckCircle2, Clock3, LayoutTemplate } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../components/feedback/empty-state";
import { PageHeader } from "../components/layout/page-header";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

type ModulePageProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  soon?: boolean;
};

export function ModulePage({ title, description, icon: Icon, soon = true }: ModulePageProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <PageHeader title={title} description={description} badge={soon ? "Em evolução" : "Estrutura inicial"} />

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.75fr)]">
        <Card>
          <CardContent>
            <EmptyState
              icon={Icon}
              title={`${title} será desenvolvido em um próximo sprint`}
              description="Esta área já faz parte da navegação do produto, mas ainda não possui dados, fluxos ou regras de negócio."
              action={<Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}><ArrowLeft className="size-4" />Voltar ao dashboard</Button>}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Estado do módulo</CardTitle><CardDescription>Transparência sobre esta etapa do produto.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <StatusRow icon={CheckCircle2} label="Navegação e layout" status="Pronto" tone="success" />
            <StatusRow icon={LayoutTemplate} label="Padrão visual" status="Pronto" tone="success" />
            <StatusRow icon={Clock3} label="Funcionalidades" status="Planejado" tone="outline" />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StatusRow({ icon: Icon, label, status, tone }: { icon: LucideIcon; label: string; status: string; tone: "success" | "outline" }) {
  return <div className="flex items-center gap-3"><div className="grid size-8 place-items-center rounded-md bg-secondary text-muted-foreground"><Icon className="size-4" /></div><span className="flex-1 text-sm font-medium">{label}</span><Badge variant={tone}>{status}</Badge></div>;
}
