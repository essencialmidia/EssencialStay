import { AlertTriangle, Building2, DoorOpen, Plus, Settings2, Sparkles, UsersRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../../components/feedback/empty-state";
import { ErrorState } from "../../components/feedback/error-state";
import { LoadingState } from "../../components/feedback/loading-state";
import { PageHeader } from "../../components/layout/page-header";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { DataTable } from "../../components/ui/data-table";
import { StatCard } from "../../components/ui/stat-card";
import { usePlatformAdmin } from "../../contexts/platform-admin-context";
import { usePlatformData } from "../../hooks/use-platform-data";
import { formatDate } from "../../lib/formatters";

export function AdminDashboardPage() {
  const { data, loading, error, reload } = usePlatformData();
  const { canManagePlatform } = usePlatformAdmin();
  const navigate = useNavigate();
  if (loading) return <LoadingState label="Carregando visão global" />;
  if (error) return <ErrorState description={error} onRetry={() => void reload()} />;

  const ativas = data.organizacoes.filter((item) => item.status === "ativo").length;
  const comAutomacao = data.propriedades.filter((item) => data.automacoes.some((config) => config.propriedade_id === item.id && config.possui_automacao !== "nao_possui")).length;
  const semAutomacao = data.propriedades.length - comAutomacao;
  const implantacoes = data.automacoes.filter((item) => item.situacao_instalacao === "em_instalacao" || item.situacao_instalacao === "planejada");
  const pendencias = [
    ...data.organizacoes.filter((item) => !item.documento || !item.email).map((item) => ({ id: `org-${item.id}`, title: item.nome_fantasia || item.nome, detail: "Dados cadastrais incompletos", action: () => navigate(`/admin/empresas/${item.id}`) })),
    ...data.propriedades.filter((item) => !data.unidades.some((unit) => unit.propriedade_id === item.id)).map((item) => ({ id: `prop-${item.id}`, title: item.nome, detail: "Nenhuma unidade cadastrada", action: () => navigate(`/admin/propriedades/${item.id}`) })),
  ];

  return <div className="space-y-8">
      <PageHeader title="Administração Essencial Stay" description="Visão consolidada e real das empresas clientes da plataforma." badge="Global" actions={canManagePlatform ? <Button onClick={() => navigate("/onboarding?modo=nova-empresa")}><Plus className="size-4" />Nova empresa cliente</Button> : undefined} />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard title="Empresas ativas" value={String(ativas)} detail={`${data.organizacoes.length} cadastradas`} icon={Building2} tone="highlight" /><StatCard title="Propriedades" value={String(data.propriedades.length)} detail={`${implantacoes.length} em implantação`} icon={Settings2} /><StatCard title="Unidades" value={String(data.unidades.length)} detail="cadastros operacionais" icon={DoorOpen} tone="success" /><StatCard title="Usuários vinculados" value={String(new Set(data.membros.filter((item) => item.ativo).map((item) => item.perfil_id)).size)} detail="perfis únicos ativos" icon={UsersRound} /></section>
    <section className="grid gap-4 sm:grid-cols-2"><Card><CardContent className="flex items-center gap-4 p-5"><div className="grid size-11 place-items-center rounded-md bg-info/10 text-info"><Sparkles className="size-5" /></div><div><p className="text-2xl font-semibold tabular-nums">{comAutomacao}</p><p className="text-sm text-muted-foreground">Propriedades com automação</p></div></CardContent></Card><Card><CardContent className="flex items-center gap-4 p-5"><div className="grid size-11 place-items-center rounded-md bg-secondary text-muted-foreground"><Sparkles className="size-5" /></div><div><p className="text-2xl font-semibold tabular-nums">{semAutomacao}</p><p className="text-sm text-muted-foreground">Propriedades sem automação</p></div></CardContent></Card></section>
    <section className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
      <Card><CardHeader><CardTitle>Empresas adicionadas recentemente</CardTitle><CardDescription>Cadastros mais recentes visíveis ao administrador global.</CardDescription></CardHeader><CardContent>{data.organizacoes.length === 0 ? <EmptyState compact title="Nenhuma empresa cliente" description="O primeiro cadastro aparecerá aqui." icon={Building2} /> : <DataTable columns={[{ key: "empresa", header: "Empresa" }, { key: "tipo", header: "Tipo" }, { key: "status", header: "Status" }, { key: "data", header: "Cadastro" }]} rows={data.organizacoes.slice(0, 5).map((item) => ({ empresa: <button type="button" className="font-medium hover:underline" onClick={() => navigate(`/admin/empresas/${item.id}`)}>{item.nome_fantasia || item.nome}</button>, tipo: <span className="text-muted-foreground">{item.tipo === "pessoa_juridica" ? "Pessoa jurídica" : "Pessoa física"}</span>, status: <Badge variant={item.status === "ativo" ? "success" : item.status === "suspenso" ? "warning" : "muted"}>{item.status}</Badge>, data: <span className="text-muted-foreground">{formatDate(item.criado_em)}</span> }))} />}</CardContent></Card>
      <Card><CardHeader><CardTitle>Pendências de configuração</CardTitle><CardDescription>Cadastros que exigem atenção administrativa.</CardDescription></CardHeader><CardContent>{pendencias.length === 0 ? <EmptyState compact title="Tudo em ordem" description="Nenhuma pendência cadastral encontrada." icon={Settings2} /> : <div className="space-y-2">{pendencias.slice(0, 6).map((item) => <button key={item.id} type="button" onClick={item.action} className="flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors hover:bg-secondary/55"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" /><span><span className="block text-sm font-medium">{item.title}</span><span className="mt-0.5 block text-xs text-muted-foreground">{item.detail}</span></span></button>)}</div>}</CardContent></Card>
    </section>
    <Card><CardHeader><CardTitle>Propriedades em implantação</CardTitle><CardDescription>Automação planejada ou em instalação, sem conexão com fabricantes.</CardDescription></CardHeader><CardContent>{implantacoes.length === 0 ? <EmptyState compact title="Nenhuma implantação em andamento" description="As configurações planejadas aparecerão aqui." icon={Settings2} /> : <div className="grid gap-3 md:grid-cols-2">{implantacoes.map((item) => { const property = data.propriedades.find((prop) => prop.id === item.propriedade_id); return property ? <button type="button" key={item.id} onClick={() => navigate(`/admin/propriedades/${property.id}`)} className="flex items-center justify-between rounded-md border p-4 text-left hover:bg-secondary/50"><div><p className="text-sm font-medium">{property.nome}</p><p className="mt-1 text-xs text-muted-foreground">{item.modelo || "Modelo não informado"}</p></div><Badge variant="warning">{item.situacao_instalacao === "planejada" ? "Planejada" : "Em instalação"}</Badge></button> : null; })}</div>}</CardContent></Card>
  </div>;
}
