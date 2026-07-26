import { BedDouble, Building2, Clock3, FileText, Hash, MapPin, Pencil, Plus, Power, RotateCcw, Rows3, Sparkles, Users } from "lucide-react";
import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EmptyState } from "../components/feedback/empty-state";
import { LoadingState } from "../components/feedback/loading-state";
import { PageHeader } from "../components/layout/page-header";
import { EstadoUnidadeBadge } from "../components/operacao/estado-unidade-badge";
import { BulkUnitModal } from "../components/propriedades/bulk-unit-modal";
import { PropriedadeModal } from "../components/propriedades/propriedade-modal";
import { UnidadeModal } from "../components/propriedades/unidade-modal";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { ConfirmationModal } from "../components/ui/confirmation-modal";
import { CursorPagination } from "../components/ui/cursor-pagination";
import { DataTable } from "../components/ui/data-table";
import { Tooltip } from "../components/ui/tooltip";
import { useToast } from "../components/ui/toast";
import { useOrganization } from "../contexts/organization-context";
import { useDashboardData } from "../hooks/use-dashboard-data";
import { useCursorPaginatedQuery } from "../hooks/use-cursor-paginated-query";
import { formatDate, formatDocument, formatTime } from "../lib/formatters";
import { nomesMarcas, nomesRecursos, nomesSituacaoAutomacao, nomesSituacaoInstalacao } from "../lib/recursos-inteligentes";
import { listarEstadosUnidade, type EstadoUnidadeCursor } from "../services/operacao.service";
import { alterarStatusPropriedade } from "../services/propriedades.service";
import { atualizarUnidade } from "../services/unidades.service";
import { nomesTiposPropriedade, nomesTiposUnidade, type Unidade } from "../types/database";

const unidadesPorPagina = 25;

export function PropriedadeDetalhesPage() {
  const { propriedadeId } = useParams();
  const { organizacaoAtual } = useOrganization();
  const { data, loading, reload } = useDashboardData(organizacaoAtual?.id);
  const { showToast } = useToast();
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [propertyEditSection, setPropertyEditSection] = useState<"dados" | "automacao">("dados");
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unidade | null>(null);
  const [confirmingUnit, setConfirmingUnit] = useState<Unidade | null>(null);
  const [confirmingProperty, setConfirmingProperty] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const loadOperationalStates = useCallback(async (cursor: EstadoUnidadeCursor | null) => {
    if (!organizacaoAtual?.id || !propriedadeId) {
      return { itens: [], proximoCursor: null };
    }
    return listarEstadosUnidade({
      organizacaoId: organizacaoAtual.id,
      propriedadeId,
      cursor,
      tamanhoPagina: unidadesPorPagina,
    });
  }, [organizacaoAtual?.id, propriedadeId]);

  const estadosOperacionais = useCursorPaginatedQuery(
    loadOperationalStates,
    `${organizacaoAtual?.id ?? "sem-organizacao"}:${propriedadeId ?? "sem-propriedade"}`,
  );

  if (loading) return <LoadingState label="Carregando propriedade" />;

  const propriedade = data.propriedades.find((item) => item.id === propriedadeId);
  if (!propriedade || !organizacaoAtual) {
    return <EmptyState title="Propriedade não encontrada" description="Ela pode não pertencer à empresa ativa." icon={Building2} action={<Link to="/propriedades" className="inline-flex h-10 items-center justify-center rounded-md border border-primary bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90">Voltar para propriedades</Link>} />;
  }

  const propriedadeAtualId = propriedade.id;
  const unidades = data.unidades.filter((item) => item.propriedade_id === propriedade.id);
  const unidadesAtivas = unidades.filter((item) => item.ativo);
  const usarFallbackLegado = Boolean(estadosOperacionais.error)
    || (unidades.length > 0 && estadosOperacionais.data.itens.length === 0 && !estadosOperacionais.temAnterior);
  const unidadesExibidas = usarFallbackLegado
    ? unidades
    : estadosOperacionais.data.itens
      .map((estado) => unidades.find((unidade) => unidade.id === estado.unidade_id))
      .filter((unidade): unidade is Unidade => Boolean(unidade));
  const automacao = data.automacoes.find((item) => item.propriedade_id === propriedade.id);
  const possuiAutomacao = Boolean(automacao && automacao.possui_automacao !== "nao_possui");

  function openNewUnit() {
    setEditingUnit(null);
    setUnitModalOpen(true);
  }

  async function changePropertyStatus(status: "ativa" | "inativa") {
    setProcessingId(propriedadeAtualId);
    try {
      await alterarStatusPropriedade(propriedadeAtualId, status);
      await reload();
      setConfirmingProperty(false);
      showToast(status === "ativa" ? "Propriedade reativada." : "Propriedade inativada.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Não foi possível alterar o status da propriedade.", "error");
    } finally {
      setProcessingId(null);
    }
  }

  async function changeUnitActive(unidade: Unidade, ativo: boolean) {
    setProcessingId(unidade.id);
    try {
      await atualizarUnidade({ id: unidade.id, ativo });
      await reload();
      setConfirmingUnit(null);
      showToast(ativo ? "Unidade reativada." : "Unidade inativada.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Não foi possível alterar a unidade.", "error");
    } finally {
      setProcessingId(null);
    }
  }

  async function reloadUnitsAndStates() {
    await reload();
    estadosOperacionais.reset();
  }

  const enderecoCompleto = [propriedade.endereco, propriedade.numero, propriedade.complemento, propriedade.bairro, propriedade.cidade, propriedade.estado, propriedade.cep, propriedade.pais].filter(Boolean).join(", ");

  return (
    <div className="space-y-8">
      <PageHeader
        title={propriedade.nome_fantasia || propriedade.nome}
        description={`${nomesTiposPropriedade[propriedade.tipo]} de ${organizacaoAtual.nome_fantasia || organizacaoAtual.nome}`}
        breadcrumb={["Essencial Stay", "Propriedades", propriedade.nome_fantasia || propriedade.nome]}
        badge={propriedade.status === "ativa" ? "Ativa" : "Inativa"}
        actions={<>
          <Button variant="outline" onClick={() => { setPropertyEditSection("dados"); setPropertyModalOpen(true); }}><Pencil className="size-4" />Editar</Button>
          <Button variant="outline" onClick={() => propriedade.status === "ativa" ? setConfirmingProperty(true) : void changePropertyStatus("ativa")}>{propriedade.status === "ativa" ? <Power className="size-4" /> : <RotateCcw className="size-4" />}{propriedade.status === "ativa" ? "Inativar" : "Reativar"}</Button>
        </>}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.75fr)]">
        <Card>
          <CardHeader><CardTitle>Dados da propriedade</CardTitle><CardDescription>Cadastro, localização e horários padrão.</CardDescription></CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <DetailItem icon={Building2} label="Nome" value={propriedade.nome} />
            <DetailItem icon={Hash} label="Identificação" value={propriedade.nome_fantasia || "Não informada"} />
            <DetailItem icon={FileText} label="Documento" value={formatDocument(propriedade.documento)} />
            <DetailItem icon={MapPin} label="Endereço completo" value={enderecoCompleto || "Não informado"} />
            <DetailItem icon={Clock3} label="Check-in" value={formatTime(propriedade.horario_checkin)} />
            <DetailItem icon={Clock3} label="Check-out" value={formatTime(propriedade.horario_checkout)} />
            <DetailItem icon={Clock3} label="Fuso horário" value={propriedade.fuso_horario} />
            <DetailItem icon={Rows3} label="Unidades ativas" value={unidades.length === unidadesAtivas.length ? String(unidadesAtivas.length) : `${unidadesAtivas.length} de ${unidades.length}`} />
            <DetailItem icon={Clock3} label="Criada em" value={formatDate(propriedade.criado_em)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3"><div><CardTitle>Automação</CardTitle><CardDescription>Configuração vinculada à propriedade.</CardDescription></div><Tooltip content="Editar automação"><Button size="icon" variant="ghost" className="-mr-2 -mt-1 size-8" aria-label="Editar automação da propriedade" onClick={() => { setPropertyEditSection("automacao"); setPropertyModalOpen(true); }}><Pencil className="size-4" /></Button></Tooltip></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4"><span className="text-sm text-muted-foreground">Situação</span><Badge variant={possuiAutomacao ? "info" : "muted"}>{automacao ? nomesSituacaoAutomacao[automacao.possui_automacao] : "Não configurada"}</Badge></div>
            <div className="flex items-center justify-between border-t pt-4"><span className="text-sm text-muted-foreground">Marca</span><span className="text-sm font-medium">{possuiAutomacao && automacao ? nomesMarcas[automacao.marca] : "Não se aplica"}</span></div>
            {possuiAutomacao && automacao && <>
              <div className="flex items-center justify-between gap-4 border-t pt-4"><span className="text-sm text-muted-foreground">Modelo</span><span className="text-right text-sm font-medium">{automacao.modelo || "Não informado"}</span></div>
              <div className="flex items-center justify-between gap-4 border-t pt-4"><span className="text-sm text-muted-foreground">Instalação</span><span className="text-right text-sm font-medium">{automacao.situacao_instalacao ? nomesSituacaoInstalacao[automacao.situacao_instalacao] : "Não informada"}</span></div>
              <div className="border-t pt-4"><div className="flex items-center justify-between gap-4"><span className="text-sm text-muted-foreground">{automacao.possui_automacao === "instalacao_futura" ? "Recursos planejados" : "Recursos instalados"}</span><span className="text-xs font-medium tabular-nums text-muted-foreground">{automacao.recursos.length}</span></div>{automacao.recursos.length > 0 ? <div className="mt-3 flex flex-wrap gap-2">{automacao.recursos.map((recurso) => <Badge key={recurso} variant="outline">{nomesRecursos[recurso]}</Badge>)}</div> : <p className="mt-2 text-sm text-muted-foreground">Nenhum recurso informado.</p>}</div>
            </>}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div><CardTitle>Unidades</CardTitle><CardDescription>Estrutura operacional vinculada exclusivamente a esta propriedade.</CardDescription></div>
          <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => setBulkModalOpen(true)}><Rows3 className="size-4" />Cadastro em lote</Button><Button size="sm" onClick={openNewUnit}><Plus className="size-4" />Nova unidade</Button></div>
        </CardHeader>
        <CardContent>
          {unidades.length === 0 ? <EmptyState title="Nenhuma unidade" description="Cadastre individualmente ou use o cadastro em lote." icon={BedDouble} action={<Button size="sm" onClick={openNewUnit}><Plus className="size-4" />Nova unidade</Button>} /> : (
            <div className="space-y-4">
              <DataTable
              columns={[
                { key: "unidade", header: "Unidade" },
                { key: "tipo", header: "Tipo" },
                { key: "localizacao", header: "Andar / identificação" },
                { key: "capacidade", header: "Máx. hóspedes" },
                { key: "operacional", header: "Status operacional" },
                { key: "ativo", header: "Cadastro" },
                { key: "acoes", header: "", className: "w-20 text-right" },
              ]}
              rows={unidadesExibidas.map((unidade) => ({
                unidade: <div><p className="font-medium">{unidade.nome}</p><p className="mt-0.5 text-xs text-muted-foreground">{unidade.codigo || "Sem código"}</p></div>,
                tipo: <span className="text-muted-foreground">{nomesTiposUnidade[unidade.tipo]}</span>,
                localizacao: <div><p>{unidade.andar || "—"}</p><p className="mt-0.5 text-xs text-muted-foreground">{unidade.numero_identificacao || "Sem identificação"}</p></div>,
                capacidade: <span className="inline-flex items-center gap-1.5 tabular-nums"><Users className="size-3.5 text-muted-foreground" />{unidade.capacidade_hospedes ?? "—"}</span>,
                operacional: <EstadoUnidadeBadge estado={estadosOperacionais.data.itens.find((estado) => estado.unidade_id === unidade.id)?.estado_consolidado ?? unidade.status_operacional} />,
                ativo: <Badge variant={unidade.ativo ? "success" : "muted"}>{unidade.ativo ? "Ativa" : "Inativa"}</Badge>,
                acoes: <div className="flex justify-end gap-1">
                  <Tooltip content="Editar"><Button size="icon" className="size-8" variant="ghost" onClick={() => { setEditingUnit(unidade); setUnitModalOpen(true); }} aria-label={`Editar ${unidade.nome}`}><Pencil className="size-4" /></Button></Tooltip>
                  <Tooltip content={unidade.ativo ? "Inativar" : "Reativar"}><Button size="icon" className="size-8" variant="ghost" disabled={processingId === unidade.id} onClick={() => unidade.ativo ? setConfirmingUnit(unidade) : void changeUnitActive(unidade, true)} aria-label={`${unidade.ativo ? "Inativar" : "Reativar"} ${unidade.nome}`}>{unidade.ativo ? <Power className="size-4" /> : <RotateCcw className="size-4" />}</Button></Tooltip>
                </div>,
              }))}
              />
              {!usarFallbackLegado && (
                <CursorPagination
                  page={estadosOperacionais.pagina}
                  hasPrevious={estadosOperacionais.temAnterior}
                  hasNext={estadosOperacionais.temProxima}
                  onPrevious={estadosOperacionais.previousPage}
                  onNext={estadosOperacionais.nextPage}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <PropriedadeModal open={propertyModalOpen} organizacaoId={propriedade.organizacao_id} propriedade={propriedade} automacao={automacao} unidades={unidades} initialSection={propertyEditSection} onClose={() => setPropertyModalOpen(false)} onSaved={reload} onAutomationSaved={reload} onUnitsSaved={reloadUnitsAndStates} />
      <UnidadeModal open={unitModalOpen} propriedadeId={propriedade.id} unidade={editingUnit} onClose={() => setUnitModalOpen(false)} onSaved={reloadUnitsAndStates} />
      <BulkUnitModal open={bulkModalOpen} propriedadeId={propriedade.id} onClose={() => setBulkModalOpen(false)} onSaved={reloadUnitsAndStates} />
      <ConfirmationModal open={confirmingProperty} title="Inativar propriedade" description="A propriedade e suas unidades permanecerão registradas e poderão ser reativadas." confirmLabel="Inativar propriedade" destructive loading={processingId === propriedade.id} onClose={() => setConfirmingProperty(false)} onConfirm={() => changePropertyStatus("inativa")} />
      <ConfirmationModal open={Boolean(confirmingUnit)} title="Inativar unidade" description={`A unidade ${confirmingUnit?.nome ?? "selecionada"} permanecerá no histórico e poderá ser reativada.`} confirmLabel="Inativar unidade" destructive loading={Boolean(confirmingUnit && processingId === confirmingUnit.id)} onClose={() => setConfirmingUnit(null)} onConfirm={() => confirmingUnit ? changeUnitActive(confirmingUnit, false) : undefined} />
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: typeof Sparkles; label: string; value: string }) {
  return <div className="flex gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary text-muted-foreground"><Icon className="size-4" /></div><div className="min-w-0"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium leading-5">{value}</p></div></div>;
}
