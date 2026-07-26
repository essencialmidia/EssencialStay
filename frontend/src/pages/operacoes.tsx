import { Check, Play, Plus, ShieldAlert, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { BloqueioUnidadeModal } from "../components/operacao/bloqueio-unidade-modal";
import { TarefaOperacionalModal } from "../components/operacao/tarefa-operacional-modal";
import { EmptyState } from "../components/feedback/empty-state";
import { ErrorState } from "../components/feedback/error-state";
import { LoadingState } from "../components/feedback/loading-state";
import { PageHeader } from "../components/layout/page-header";
import { SectionHeading } from "../components/layout/section-heading";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { DataTable } from "../components/ui/data-table";
import { Modal } from "../components/ui/modal";
import { Select } from "../components/ui/select";
import { TablePagination } from "../components/ui/table-pagination";
import { Textarea } from "../components/ui/textarea";
import { Tooltip } from "../components/ui/tooltip";
import { useToast } from "../components/ui/toast";
import { useOrganization } from "../contexts/organization-context";
import { usePlatformAdmin } from "../contexts/platform-admin-context";
import { useDashboardData } from "../hooks/use-dashboard-data";
import { usePaginatedQuery } from "../hooks/use-paginated-query";
import { formatDateTime } from "../lib/formatters";
import { alterarStatusTarefaOperacional, encerrarBloqueioUnidade, listarBloqueiosUnidade, listarTarefasOperacionais } from "../services/operacao.service";
import { nomesPrioridadesTarefaOperacional, nomesStatusTarefaOperacional, nomesTiposBloqueioUnidade, statusTarefaOperacional, type BloqueioUnidade, type StatusTarefaOperacional, type TarefaOperacional, type TipoTarefaOperacional } from "../types/database";

const pageSize = 25;
const taskBadge = { pendente: "warning", em_andamento: "info", concluida: "success", cancelada: "muted" } as const;

type PendingAction =
  | { kind: "task"; item: TarefaOperacional; status: StatusTarefaOperacional }
  | { kind: "block"; item: BloqueioUnidade };

export function OperacoesPage({ tipo }: { tipo: Extract<TipoTarefaOperacional, "limpeza" | "manutencao"> }) {
  const { organizacaoAtual } = useOrganization();
  const { isPlatformAdmin } = usePlatformAdmin();
  const estrutura = useDashboardData(organizacaoAtual?.id);
  const { showToast } = useToast();
  const [propertyFilter, setPropertyFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [page, setPage] = useState(1);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [justification, setJustification] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => { setPage(1); }, [propertyFilter, statusFilter, tipo]);

  const loadTasks = useCallback(async () => {
    if (!organizacaoAtual) return { itens: [], total: 0, pagina: 1, tamanhoPagina: pageSize };
    return listarTarefasOperacionais({ organizacaoId: organizacaoAtual.id, propriedadeId: propertyFilter === "todos" ? undefined : propertyFilter, tipo, status: statusFilter === "todos" ? undefined : statusFilter as StatusTarefaOperacional, pagina: page, tamanhoPagina: pageSize });
  }, [organizacaoAtual, page, propertyFilter, statusFilter, tipo]);

  const loadBlocks = useCallback(async () => {
    if (!organizacaoAtual || tipo !== "manutencao") return { itens: [], total: 0, pagina: 1, tamanhoPagina: pageSize };
    return listarBloqueiosUnidade({ organizacaoId: organizacaoAtual.id, propriedadeId: propertyFilter === "todos" ? undefined : propertyFilter, situacao: "ativo", pagina: 1, tamanhoPagina: pageSize });
  }, [organizacaoAtual, propertyFilter, tipo]);

  const tasks = usePaginatedQuery(loadTasks);
  const blocks = usePaginatedQuery(loadBlocks);
  const propertyName = (id: string) => estrutura.data.propriedades.find((item) => item.id === id)?.nome_fantasia || estrutura.data.propriedades.find((item) => item.id === id)?.nome || "Propriedade";
  const unitName = (id: string) => estrutura.data.unidades.find((item) => item.id === id)?.nome || "Unidade";

  function openAction(action: PendingAction) {
    setJustification("");
    setPendingAction(action);
  }

  async function executeAction() {
    if (!pendingAction) return;
    const requiresJustification = isPlatformAdmin || (pendingAction.kind === "task" && pendingAction.status === "cancelada");
    if (requiresJustification && justification.trim().length < 3) {
      showToast("Informe a justificativa desta ação.", "error");
      return;
    }
    setProcessing(true);
    try {
      if (pendingAction.kind === "task") {
        await alterarStatusTarefaOperacional({ tarefaId: pendingAction.item.id, statusDestino: pendingAction.status, versaoEsperada: pendingAction.item.versao, justificativa: justification });
        await tasks.reload();
        showToast("Situação da tarefa atualizada.");
      } else {
        await encerrarBloqueioUnidade({ bloqueioId: pendingAction.item.id, justificativa: justification });
        await Promise.all([blocks.reload(), tasks.reload()]);
        showToast("Bloqueio encerrado.");
      }
      setPendingAction(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Não foi possível concluir a ação.", "error");
    } finally {
      setProcessing(false);
    }
  }

  if (estrutura.loading || tasks.loading || blocks.loading) return <LoadingState label={`Carregando ${tipo === "limpeza" ? "tarefas de limpeza" : "manutenção"}`} />;
  const error = estrutura.error || tasks.error || blocks.error;
  if (error) return <ErrorState description={error} onRetry={() => { void estrutura.reload(); void tasks.reload(); void blocks.reload(); }} />;

  const title = tipo === "limpeza" ? "Limpeza" : "Manutenção";
  const emptyDescription = tipo === "limpeza" ? "Crie uma tarefa de limpeza vinculada a uma unidade." : "Crie uma tarefa técnica ou registre um bloqueio impeditivo.";

  return (
    <div className="space-y-8">
      <PageHeader title={title} description={tipo === "limpeza" ? "Acompanhe as tarefas de limpeza sem antecipar o fluxo de checkout." : "Organize tarefas técnicas e restrições operacionais das unidades."} actions={<><Button onClick={() => setTaskModalOpen(true)}><Plus className="size-4" />Nova tarefa</Button>{tipo === "manutencao" && <Button variant="outline" onClick={() => setBlockModalOpen(true)}><ShieldAlert className="size-4" />Novo bloqueio</Button>}</>} />
      <div className="flex flex-wrap gap-2 rounded-md border bg-card p-3">
        <Select value={propertyFilter} onChange={(event) => setPropertyFilter(event.target.value)} className="min-w-52"><option value="todos">Todas as propriedades</option>{estrutura.data.propriedades.map((item) => <option key={item.id} value={item.id}>{item.nome_fantasia || item.nome}</option>)}</Select>
        <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="min-w-44"><option value="todos">Todos os status</option>{statusTarefaOperacional.map((item) => <option key={item} value={item}>{nomesStatusTarefaOperacional[item]}</option>)}</Select>
      </div>

      <section className="space-y-4">
        <SectionHeading title="Tarefas operacionais" description="As alterações são versionadas e auditadas pelo núcleo operacional." />
        {tasks.data.itens.length === 0 ? <EmptyState title="Nenhuma tarefa cadastrada" description={emptyDescription} icon={tipo === "limpeza" ? Check : ShieldAlert} action={<Button size="sm" onClick={() => setTaskModalOpen(true)}><Plus className="size-4" />Nova tarefa</Button>} /> : <div className="space-y-4"><DataTable columns={[{ key: "tarefa", header: "Tarefa" }, { key: "local", header: "Propriedade / unidade" }, { key: "prioridade", header: "Prioridade" }, { key: "status", header: "Status" }, { key: "prazo", header: "Prazo" }, { key: "acoes", header: "", className: "w-32 text-right" }]} rows={tasks.data.itens.map((item) => ({ tarefa: <div><p className="font-medium">{item.titulo}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.descricao || "Sem descrição"}</p></div>, local: <div><p>{propertyName(item.propriedade_id)}</p><p className="mt-0.5 text-xs text-muted-foreground">{unitName(item.unidade_id)}</p></div>, prioridade: <span>{nomesPrioridadesTarefaOperacional[item.prioridade]}</span>, status: <Badge variant={taskBadge[item.status]}>{nomesStatusTarefaOperacional[item.status]}</Badge>, prazo: <span className="text-muted-foreground">{formatDateTime(item.prazo_em)}</span>, acoes: <div className="flex justify-end gap-1">{item.status === "pendente" && <Tooltip content="Iniciar"><Button size="icon" className="size-8" variant="ghost" onClick={() => openAction({ kind: "task", item, status: "em_andamento" })}><Play className="size-4" /></Button></Tooltip>}{item.status === "em_andamento" && <Tooltip content="Concluir"><Button size="icon" className="size-8" variant="ghost" onClick={() => openAction({ kind: "task", item, status: "concluida" })}><Check className="size-4" /></Button></Tooltip>}{item.status !== "concluida" && item.status !== "cancelada" && <Tooltip content="Cancelar"><Button size="icon" className="size-8" variant="ghost" onClick={() => openAction({ kind: "task", item, status: "cancelada" })}><X className="size-4" /></Button></Tooltip>}</div> }))} /><TablePagination page={page} pageSize={pageSize} total={tasks.data.total} onPageChange={setPage} /></div>}
      </section>

      {tipo === "manutencao" && <section className="space-y-4"><SectionHeading title="Bloqueios ativos" description="Restrições impeditivas são exibidas sem substituir o estado real da jornada." />{blocks.data.itens.length === 0 ? <EmptyState compact title="Nenhum bloqueio ativo" description="A operação não possui restrições cadastradas neste contexto." icon={ShieldAlert} /> : <DataTable columns={[{ key: "motivo", header: "Motivo" }, { key: "local", header: "Propriedade / unidade" }, { key: "tipo", header: "Tipo" }, { key: "periodo", header: "Período" }, { key: "acoes", header: "", className: "w-24 text-right" }]} rows={blocks.data.itens.map((item) => ({ motivo: <span className="font-medium">{item.motivo}</span>, local: <div><p>{propertyName(item.propriedade_id)}</p><p className="mt-0.5 text-xs text-muted-foreground">{unitName(item.unidade_id)}</p></div>, tipo: <Badge variant={item.impeditivo ? "warning" : "outline"}>{nomesTiposBloqueioUnidade[item.tipo]}</Badge>, periodo: <span className="text-muted-foreground">{formatDateTime(item.inicio_em)} · {item.fim_em ? formatDateTime(item.fim_em) : "Sem término"}</span>, acoes: <Button size="sm" variant="ghost" onClick={() => openAction({ kind: "block", item })}>Encerrar</Button> }))} />}</section>}

      <TarefaOperacionalModal open={taskModalOpen} tipo={tipo} propriedades={estrutura.data.propriedades} unidades={estrutura.data.unidades} exigeJustificativa={isPlatformAdmin} onClose={() => setTaskModalOpen(false)} onSaved={tasks.reload} />
      <BloqueioUnidadeModal open={blockModalOpen} propriedades={estrutura.data.propriedades} unidades={estrutura.data.unidades} exigeJustificativa={isPlatformAdmin} onClose={() => setBlockModalOpen(false)} onSaved={blocks.reload} />
      <Modal open={Boolean(pendingAction)} title={pendingAction?.kind === "block" ? "Encerrar bloqueio" : "Confirmar alteração"} description="A ação será registrada no histórico operacional." onClose={() => setPendingAction(null)}>
        <div className="space-y-4">{(isPlatformAdmin || (pendingAction?.kind === "task" && pendingAction.status === "cancelada")) && <div><label className="text-sm font-medium" htmlFor="operational-justification">Justificativa</label><Textarea id="operational-justification" className="mt-2" value={justification} onChange={(event) => setJustification(event.target.value)} /></div>}<div className="flex justify-end gap-2 border-t pt-4"><Button variant="ghost" onClick={() => setPendingAction(null)}>Cancelar</Button><Button disabled={processing} onClick={() => void executeAction()}>{processing ? "Processando..." : "Confirmar"}</Button></div></div>
      </Modal>
    </div>
  );
}
