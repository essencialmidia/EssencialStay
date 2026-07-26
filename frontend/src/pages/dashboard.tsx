import {
  ArrowRight,
  BedDouble,
  Building2,
  CalendarDays,
  CheckCircle2,
  Cpu,
  DoorOpen,
  MapPinned,
  MessageSquareText,
  Plus,
  PlugZap,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  WifiOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../components/feedback/empty-state";
import { ErrorState } from "../components/feedback/error-state";
import { LoadingState } from "../components/feedback/loading-state";
import { PageHeader } from "../components/layout/page-header";
import { SectionHeading } from "../components/layout/section-heading";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { DataTable } from "../components/ui/data-table";
import { StatCard } from "../components/ui/stat-card";
import { useOrganization } from "../contexts/organization-context";
import { useDashboardData } from "../hooks/use-dashboard-data";
import { useIotDashboardSummary } from "../hooks/use-iot-dashboard-summary";
import { useOperationalSummary } from "../hooks/use-operational-summary";
import type { ResumoOperacional, StatusPropriedade } from "../types/database";

const propertyStatus: Record<StatusPropriedade, { label: string; variant: "success" | "muted" | "warning" }> = {
  ativa: { label: "Ativa", variant: "success" },
  inativa: { label: "Inativa", variant: "muted" },
};

const unitStatus: Array<{ key: keyof ResumoOperacional; label: string; className: string }> = [
  { key: "disponiveis", label: "Disponíveis", className: "bg-success" },
  { key: "reservadas", label: "Reservadas", className: "bg-info" },
  { key: "preparando", label: "Em preparação", className: "bg-warning" },
  { key: "prontas_checkin", label: "Prontas para check-in", className: "bg-highlight" },
  { key: "ocupadas", label: "Ocupadas", className: "bg-info" },
  { key: "aguardando_limpeza", label: "Aguardando limpeza", className: "bg-warning" },
  { key: "em_limpeza", label: "Em limpeza", className: "bg-warning" },
  { key: "manutencoes_impeditivas", label: "Manutenção impeditiva", className: "bg-destructive" },
  { key: "bloqueios_impeditivos", label: "Bloqueadas", className: "bg-muted-foreground" },
];

export function DashboardPage() {
  const { organizacaoAtual } = useOrganization();
  const { data, loading, error, reload } = useDashboardData(organizacaoAtual?.id);
  const iot = useIotDashboardSummary(organizacaoAtual?.id);
  const operacao = useOperationalSummary(organizacaoAtual?.id);
  const navigate = useNavigate();

  const propriedadesAtivas = data.propriedades.filter((propriedade) => propriedade.status === "ativa").length;
  const unidadesAtivas = data.unidades.filter((unidade) => unidade.ativo);
  const unidadesDisponiveis = operacao.data.disponiveis;
  const unidadesOcupadas = operacao.data.ocupadas;
  const limpezasPendentes = operacao.data.aguardando_limpeza + operacao.data.em_limpeza;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Visão geral"
        description={`Acompanhe a estrutura operacional de ${organizacaoAtual?.nome_fantasia || organizacaoAtual?.nome || "sua empresa"} em um só lugar.`}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate("/experiencia-hospede")}><MessageSquareText className="size-4" />Experiência do hóspede</Button>
            <Button onClick={() => navigate("/propriedades/nova")}><Plus className="size-4" />Nova propriedade</Button>
          </>
        }
      />

      {loading && <LoadingState label="Organizando sua visão operacional" />}
      {error && <ErrorState description={error} onRetry={() => void reload()} />}

      {!loading && !error && (
        <>
          <section aria-label="Indicadores da operação" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Propriedades" value={String(data.propriedades.length)} detail={`${propriedadesAtivas} ativas`} icon={Building2} tone="highlight" />
            <StatCard title="Unidades" value={String(operacao.data.total_unidades)} detail={operacao.error ? "indicador indisponível" : `${unidadesDisponiveis} disponíveis`} icon={DoorOpen} tone="success" />
            <StatCard title="Ocupação atual" value={String(unidadesOcupadas)} detail="unidades ocupadas" icon={BedDouble} />
            <StatCard title="Aguardando limpeza" value={String(limpezasPendentes)} detail={limpezasPendentes === 0 ? "operação em dia" : "requer atenção"} icon={CheckCircle2} tone={limpezasPendentes === 0 ? "success" : "warning"} />
          </section>

          <section aria-label="Indicadores de integrações e dispositivos" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard title="Integrações" value={String(iot.data.conexoesTotal)} detail={`${iot.data.conexoesAtivas} conectadas`} icon={PlugZap} tone="highlight" />
            <StatCard title="Dispositivos" value={String(iot.data.dispositivosAtivos)} detail={`${iot.data.dispositivosTotal} cadastrados`} icon={Cpu} />
            <StatCard title="Ambientes" value={String(iot.data.ambientesAtivos)} detail={`${iot.data.ambientesTotal} cadastrados`} icon={MapPinned} tone="success" />
            <StatCard title="Offline" value={String(iot.data.dispositivosOffline)} detail={iot.error ? "indicador indisponível" : iot.data.dispositivosOffline === 0 ? "nenhum dispositivo offline" : "requer atenção"} icon={WifiOff} tone={iot.data.dispositivosOffline === 0 ? "success" : "warning"} />
            <StatCard title="Última sincronização" value="Nunca" detail="Nenhuma sincronização executada." icon={RefreshCw} />
            <StatCard title="Status" value="Operando normalmente" detail="Sistema saudável" icon={ShieldCheck} tone="success" valueClassName="text-xl leading-7" />
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>Portfólio ativo</CardTitle>
                  <CardDescription>Propriedades da empresa e sua configuração atual.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate("/propriedades")}>Ver todas<ArrowRight className="size-4" /></Button>
              </CardHeader>
              <CardContent>
                {data.propriedades.length > 0 ? (
                  <DataTable
                    columns={[
                      { key: "nome", header: "Propriedade" },
                      { key: "tipo", header: "Tipo" },
                      { key: "unidades", header: "Unidades" },
                      { key: "status", header: "Status" },
                    ]}
                    rows={data.propriedades.map((propriedade) => {
                      const status = propertyStatus[propriedade.status];
                      return {
                        nome: <span className="font-medium">{propriedade.nome}</span>,
                        tipo: <span className="capitalize text-muted-foreground">{propriedade.tipo.replace("_", " ")}</span>,
                        unidades: <span className="tabular-nums">{data.unidades.filter((unidade) => unidade.propriedade_id === propriedade.id && unidade.ativo).length}</span>,
                        status: <Badge variant={status.variant}><span className="size-1.5 rounded-full bg-current" />{status.label}</Badge>,
                      };
                    })}
                  />
                ) : (
                  <EmptyState compact title="Seu portfólio começa aqui" description="Cadastre uma propriedade para estruturar unidades e preparar a operação." icon={Building2} action={<Button size="sm" onClick={() => navigate("/propriedades/nova")}><Plus className="size-4" />Adicionar propriedade</Button>} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status das unidades</CardTitle>
                <CardDescription>Distribuição operacional neste momento.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {unidadesAtivas.length > 0 ? (
                  <>
                    <div className="flex h-2 overflow-hidden rounded-full bg-secondary">
                      {unitStatus.map((item) => {
                        const count = operacao.data[item.key];
                        return count > 0 ? <div key={item.key} className={item.className} style={{ width: `${(count / operacao.data.total_unidades) * 100}%` }} /> : null;
                      })}
                    </div>
                    <div className="space-y-3">
                      {unitStatus.map((item) => {
                        const count = operacao.data[item.key];
                        return (
                          <div key={item.key} className="flex items-center gap-3 text-sm">
                            <span className={`size-2 rounded-full ${item.className}`} />
                            <span className="flex-1 text-muted-foreground">{item.label}</span>
                            <span className="tabular-nums font-semibold">{count}</span>
                          </div>
                        );
                      })}
                      <div className="flex items-center gap-3 border-t pt-3 text-sm"><span className="size-2 rounded-full bg-muted-foreground" /><span className="flex-1 text-muted-foreground">Tarefas pendentes</span><span className="tabular-nums font-semibold">{operacao.data.tarefas_pendentes}</span></div>
                    </div>
                  </>
                ) : (
                  <EmptyState compact title="Sem unidades cadastradas" description="As unidades aparecerão aqui com seus respectivos estados." icon={DoorOpen} />
                )}
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <SectionHeading title="Próximos movimentos" description="Atalhos para as áreas que organizam a experiência de hospedagem." />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Card variant="interactive" className="cursor-pointer" onClick={() => navigate("/experiencia-hospede")}>
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="grid size-10 shrink-0 place-items-center rounded-md bg-accent/[0.12] text-accent"><Sparkles className="size-5" /></div>
                  <div className="min-w-0"><p className="font-semibold">Experiência do hóspede</p><p className="mt-1 text-sm leading-5 text-muted-foreground">Visualize a jornada digital da chegada ao checkout.</p></div>
                  <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
              <Card variant="interactive" className="cursor-pointer" onClick={() => navigate("/propriedades")}>
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="grid size-10 shrink-0 place-items-center rounded-md bg-info/[0.12] text-info"><Building2 className="size-5" /></div>
                  <div className="min-w-0"><p className="font-semibold">Organizar propriedades</p><p className="mt-1 text-sm leading-5 text-muted-foreground">Revise os cadastros e a estrutura das unidades.</p></div>
                  <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary text-muted-foreground"><CalendarDays className="size-5" /></div>
                  <div className="min-w-0"><div className="flex items-center gap-2"><p className="font-semibold">Próximas chegadas</p><Badge variant="outline">Em breve</Badge></div><p className="mt-1 text-sm leading-5 text-muted-foreground">Reservas serão adicionadas em um próximo sprint.</p></div>
                </CardContent>
              </Card>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
