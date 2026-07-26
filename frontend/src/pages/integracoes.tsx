import { Eye, Pencil, PlugZap, Plus, Power, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "../components/feedback/empty-state";
import { ErrorState } from "../components/feedback/error-state";
import { LoadingState } from "../components/feedback/loading-state";
import { ConexaoIntegracaoModal } from "../components/integracoes/conexao-integracao-modal";
import { DetailList } from "../components/iot/detail-list";
import { EntityToolbar } from "../components/iot/entity-toolbar";
import { PageHeader } from "../components/layout/page-header";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ConfirmationModal } from "../components/ui/confirmation-modal";
import { DataTable } from "../components/ui/data-table";
import { Modal } from "../components/ui/modal";
import { Select } from "../components/ui/select";
import { TablePagination } from "../components/ui/table-pagination";
import { Tooltip } from "../components/ui/tooltip";
import { useToast } from "../components/ui/toast";
import { useOrganization } from "../contexts/organization-context";
import { useDashboardData } from "../hooks/use-dashboard-data";
import { useDebouncedValue } from "../hooks/use-debounced-value";
import { usePaginatedQuery } from "../hooks/use-paginated-query";
import { formatDate } from "../lib/formatters";
import { listarProvedoresIntegracao } from "../services/catalogos-iot.service";
import { atualizarConexaoIntegracao, listarConexoesIntegracao } from "../services/conexoes-integracao.service";
import { nomesAmbientesExecucaoIntegracao, nomesStatusIntegracao, statusIntegracao, type ConexaoIntegracao, type Pagina, type ProvedorIntegracao, type StatusIntegracao } from "../types/database";

const pageSize = 25;
const badgeStatus: Record<StatusIntegracao, "success" | "warning" | "muted" | "info"> = { conectada: "success", conectando: "info", erro: "warning", desconectada: "muted", desativada: "muted" };

export function IntegracoesPage() {
  const { organizacaoAtual } = useOrganization();
  const estrutura = useDashboardData(organizacaoAtual?.id);
  const { showToast } = useToast();
  const [provedores, setProvedores] = useState<ProvedorIntegracao[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("todos");
  const [providerFilter, setProviderFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ConexaoIntegracao | null>(null);
  const [viewing, setViewing] = useState<ConexaoIntegracao | null>(null);
  const [confirming, setConfirming] = useState<ConexaoIntegracao | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    let active = true;
    void listarProvedoresIntegracao()
      .then((items) => { if (active) setProvedores(items); })
      .catch((loadError) => { if (active) setCatalogError(loadError instanceof Error ? loadError.message : "Não foi possível carregar os provedores."); });
    return () => { active = false; };
  }, []);
  useEffect(() => { setPage(1); }, [debouncedSearch, propertyFilter, providerFilter, statusFilter]);

  const load = useCallback(async (): Promise<Pagina<ConexaoIntegracao>> => {
    if (!organizacaoAtual) return { itens: [], total: 0, pagina: 1, tamanhoPagina: pageSize };
    return listarConexoesIntegracao({
      organizacaoId: organizacaoAtual.id,
      busca: debouncedSearch,
      propriedadeId: propertyFilter === "todos" ? undefined : propertyFilter,
      provedorId: providerFilter === "todos" ? undefined : providerFilter,
      status: statusFilter === "todos" ? undefined : statusFilter as StatusIntegracao,
      pagina: page,
      tamanhoPagina: pageSize,
    });
  }, [debouncedSearch, organizacaoAtual, page, propertyFilter, providerFilter, statusFilter]);

  const listagem = usePaginatedQuery(load);
  const propertyName = (id: string) => estrutura.data.propriedades.find((item) => item.id === id)?.nome_fantasia || estrutura.data.propriedades.find((item) => item.id === id)?.nome || "Propriedade não encontrada";
  const linkedProperties = (item: ConexaoIntegracao) => item.propriedades.filter((vinculo) => vinculo.ativo);

  async function changeActive(item: ConexaoIntegracao, active: boolean) {
    setProcessingId(item.id);
    try {
      await atualizarConexaoIntegracao({ id: item.id, status: active ? "desconectada" : "desativada" });
      await listagem.reload();
      setConfirming(null);
      showToast(active ? "Conexão reativada." : "Conexão desativada.");
    } catch (changeError) {
      showToast(changeError instanceof Error ? changeError.message : "Não foi possível alterar a conexão.", "error");
    } finally {
      setProcessingId(null);
    }
  }

  if (estrutura.loading || listagem.loading) return <LoadingState label="Carregando conexões" />;
  const error = estrutura.error || listagem.error || catalogError;
  if (error) return <ErrorState description={error} onRetry={() => { setCatalogError(null); void estrutura.reload(); void listagem.reload(); void listarProvedoresIntegracao().then(setProvedores); }} />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Integrações"
        description="Gerencie as conexões da empresa com provedores de automação, PMS e outros serviços."
        actions={<Button disabled={estrutura.data.propriedades.length === 0 || provedores.length === 0} onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="size-4" />Nova conexão</Button>}
      />
      <EntityToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Buscar conexão">
        <Select value={propertyFilter} onChange={(event) => setPropertyFilter(event.target.value)}>
          <option value="todos">Todas as propriedades</option>
          {estrutura.data.propriedades.map((item) => <option key={item.id} value={item.id}>{item.nome_fantasia || item.nome}</option>)}
        </Select>
        <Select value={providerFilter} onChange={(event) => setProviderFilter(event.target.value)}>
          <option value="todos">Todos os provedores</option>
          {provedores.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
        </Select>
        <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="todos">Todos os status</option>
          {statusIntegracao.map((item) => <option key={item} value={item}>{nomesStatusIntegracao[item]}</option>)}
        </Select>
      </EntityToolbar>
      {listagem.data.itens.length === 0 ? (
        <EmptyState
          title="Nenhuma integração cadastrada"
          description={estrutura.data.propriedades.length === 0 ? "Cadastre uma propriedade antes de criar conexões." : (
            <div className="space-y-3">
              <p>Conecte a Essencial Stay com provedores como:</p>
              <div className="flex flex-wrap justify-center gap-2" aria-label="Provedores compatíveis">
                {["Tuya", "Akubela", "Yale", "TTLock", "MQTT", "Matter", "PMS"].map((provider) => <Badge key={provider} variant="outline">{provider}</Badge>)}
              </div>
              <p>Outros fornecedores poderão ser adicionados. Comece criando sua primeira conexão.</p>
            </div>
          )}
          icon={PlugZap}
          action={estrutura.data.propriedades.length > 0 ? <Button size="sm" onClick={() => setModalOpen(true)}><Plus className="size-4" />Nova conexão</Button> : undefined}
        />
      ) : (
        <div className="space-y-4">
          <DataTable
            columns={[{ key: "nome", header: "Conexão" }, { key: "propriedades", header: "Propriedades" }, { key: "provedor", header: "Provedor" }, { key: "ambiente", header: "Ambiente" }, { key: "status", header: "Status" }, { key: "acoes", header: "", className: "w-32 text-right" }]}
            rows={listagem.data.itens.map((item) => ({
              nome: <span className="font-medium">{item.nome_exibicao}</span>,
              propriedades: <span className="text-muted-foreground">{linkedProperties(item).length} vinculada{linkedProperties(item).length === 1 ? "" : "s"}</span>,
              provedor: <span>{item.provedor.nome}</span>,
              ambiente: <Badge variant="outline">{nomesAmbientesExecucaoIntegracao[item.ambiente_execucao]}</Badge>,
              status: <Badge variant={badgeStatus[item.status]}>{nomesStatusIntegracao[item.status]}</Badge>,
              acoes: <div className="flex justify-end gap-1"><Tooltip content="Visualizar"><Button size="icon" className="size-8" variant="ghost" onClick={() => setViewing(item)}><Eye className="size-4" /></Button></Tooltip><Tooltip content="Editar"><Button size="icon" className="size-8" variant="ghost" onClick={() => { setEditing(item); setModalOpen(true); }}><Pencil className="size-4" /></Button></Tooltip><Tooltip content={item.status === "desativada" ? "Reativar" : "Desativar"}><Button size="icon" className="size-8" variant="ghost" disabled={processingId === item.id} onClick={() => item.status === "desativada" ? void changeActive(item, true) : setConfirming(item)}>{item.status === "desativada" ? <RotateCcw className="size-4" /> : <Power className="size-4" />}</Button></Tooltip></div>,
            }))}
          />
          <TablePagination page={page} pageSize={pageSize} total={listagem.data.total} onPageChange={setPage} />
        </div>
      )}
      {organizacaoAtual && <ConexaoIntegracaoModal open={modalOpen} organizacaoId={organizacaoAtual.id} propriedades={estrutura.data.propriedades} provedores={provedores} value={editing} onClose={() => { setModalOpen(false); setEditing(null); }} onSaved={listagem.reload} />}
      <Modal open={Boolean(viewing)} title={viewing?.nome_exibicao ?? "Conexão"} description="Detalhes cadastrais, sem credenciais" onClose={() => setViewing(null)}>
        {viewing && <DetailList items={[{ label: "Provedor", value: viewing.provedor.nome }, { label: "Propriedades", value: linkedProperties(viewing).map((item) => propertyName(item.propriedade_id)).join(", ") }, { label: "Ambiente", value: nomesAmbientesExecucaoIntegracao[viewing.ambiente_execucao] }, { label: "Status", value: nomesStatusIntegracao[viewing.status] }, { label: "Criada em", value: formatDate(viewing.criado_em) }]} />}
      </Modal>
      <ConfirmationModal open={Boolean(confirming)} title="Desativar conexão" description={`A conexão ${confirming?.nome_exibicao ?? "selecionada"} permanecerá cadastrada e poderá ser reativada.`} confirmLabel="Desativar conexão" destructive loading={Boolean(confirming && processingId === confirming.id)} onClose={() => setConfirming(null)} onConfirm={() => confirming ? changeActive(confirming, false) : undefined} />
    </div>
  );
}
