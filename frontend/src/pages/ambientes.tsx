import { Eye, MapPin, Pencil, Plus, Power, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AmbienteModal } from "../components/ambientes/ambiente-modal";
import { EmptyState } from "../components/feedback/empty-state";
import { ErrorState } from "../components/feedback/error-state";
import { LoadingState } from "../components/feedback/loading-state";
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
import { atualizarAmbiente, listarAmbientes } from "../services/ambientes.service";
import type { Ambiente, Pagina } from "../types/database";

const pageSize = 25;

export function AmbientesPage() {
  const { organizacaoAtual } = useOrganization();
  const estrutura = useDashboardData(organizacaoAtual?.id);
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("todos");
  const [activeFilter, setActiveFilter] = useState("ativos");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Ambiente | null>(null);
  const [viewing, setViewing] = useState<Ambiente | null>(null);
  const [confirming, setConfirming] = useState<Ambiente | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => { setPage(1); }, [activeFilter, debouncedSearch, propertyFilter]);

  const load = useCallback(async (): Promise<Pagina<Ambiente>> => {
    if (!organizacaoAtual) return { itens: [], total: 0, pagina: 1, tamanhoPagina: pageSize };
    return listarAmbientes({
      organizacaoId: organizacaoAtual.id,
      busca: debouncedSearch,
      propriedadeId: propertyFilter === "todos" ? undefined : propertyFilter,
      ativo: activeFilter === "todos" ? undefined : activeFilter === "ativos",
      pagina: page,
      tamanhoPagina: pageSize,
    });
  }, [activeFilter, debouncedSearch, organizacaoAtual, page, propertyFilter]);

  const listagem = usePaginatedQuery(load);
  const propertyName = (id: string) => estrutura.data.propriedades.find((item) => item.id === id)?.nome_fantasia || estrutura.data.propriedades.find((item) => item.id === id)?.nome || "Propriedade não encontrada";
  const unitName = (id: string | null) => id ? estrutura.data.unidades.find((item) => item.id === id)?.nome || "Unidade não encontrada" : "Área comum";
  const parentName = (id: string | null) => id ? listagem.data.itens.find((item) => item.id === id)?.nome || "Ambiente relacionado" : "Sem ambiente superior";

  async function changeActive(item: Ambiente, ativo: boolean) {
    setProcessingId(item.id);
    try {
      await atualizarAmbiente({ id: item.id, ativo });
      await listagem.reload();
      setConfirming(null);
      showToast(ativo ? "Ambiente reativado." : "Ambiente inativado.");
    } catch (changeError) {
      showToast(changeError instanceof Error ? changeError.message : "Não foi possível alterar o ambiente.", "error");
    } finally {
      setProcessingId(null);
    }
  }

  if (estrutura.loading || listagem.loading) return <LoadingState label="Carregando ambientes" />;
  const error = estrutura.error || listagem.error;
  if (error) return <ErrorState description={error} onRetry={() => { void estrutura.reload(); void listagem.reload(); }} />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ambientes"
        description={`Organização física das propriedades de ${organizacaoAtual?.nome_fantasia || organizacaoAtual?.nome}.`}
        actions={<Button disabled={estrutura.data.propriedades.length === 0} onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="size-4" />Novo ambiente</Button>}
      />
      <EntityToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Buscar ambiente">
        <Select value={propertyFilter} onChange={(event) => setPropertyFilter(event.target.value)} className="min-w-44">
          <option value="todos">Todas as propriedades</option>
          {estrutura.data.propriedades.map((item) => <option key={item.id} value={item.id}>{item.nome_fantasia || item.nome}</option>)}
        </Select>
        <Select value={activeFilter} onChange={(event) => setActiveFilter(event.target.value)} className="min-w-32">
          <option value="ativos">Ativos</option><option value="inativos">Inativos</option><option value="todos">Todos</option>
        </Select>
      </EntityToolbar>
      {listagem.data.itens.length === 0 ? (
        <EmptyState
          title="Ainda não existem ambientes cadastrados."
          description={estrutura.data.propriedades.length === 0 ? "Cadastre uma propriedade antes de criar ambientes." : "Crie o primeiro ambiente da propriedade para começar a organizar os dispositivos."}
          icon={MapPin}
          action={estrutura.data.propriedades.length > 0 ? <Button size="sm" onClick={() => setModalOpen(true)}><Plus className="size-4" />Novo ambiente</Button> : undefined}
        />
      ) : (
        <div className="space-y-4">
          <DataTable
            columns={[{ key: "nome", header: "Ambiente" }, { key: "propriedade", header: "Propriedade / unidade" }, { key: "descricao", header: "Descrição" }, { key: "status", header: "Status" }, { key: "criado", header: "Criação" }, { key: "acoes", header: "", className: "w-32 text-right" }]}
            rows={listagem.data.itens.map((item) => ({
              nome: <span className="font-medium">{item.nome}</span>,
              propriedade: <div><p>{propertyName(item.propriedade_id)}</p><p className="mt-0.5 text-xs text-muted-foreground">{unitName(item.unidade_id)}</p></div>,
              descricao: <span className="block max-w-72 truncate text-muted-foreground">{item.descricao || "Não informada"}</span>,
              status: <Badge variant={item.ativo ? "success" : "muted"}>{item.ativo ? "Ativo" : "Inativo"}</Badge>,
              criado: <span className="text-muted-foreground">{formatDate(item.criado_em)}</span>,
              acoes: <div className="flex justify-end gap-1"><Tooltip content="Visualizar"><Button size="icon" className="size-8" variant="ghost" onClick={() => setViewing(item)}><Eye className="size-4" /></Button></Tooltip><Tooltip content="Editar"><Button size="icon" className="size-8" variant="ghost" onClick={() => { setEditing(item); setModalOpen(true); }}><Pencil className="size-4" /></Button></Tooltip><Tooltip content={item.ativo ? "Inativar" : "Reativar"}><Button size="icon" className="size-8" variant="ghost" disabled={processingId === item.id} onClick={() => item.ativo ? setConfirming(item) : void changeActive(item, true)}>{item.ativo ? <Power className="size-4" /> : <RotateCcw className="size-4" />}</Button></Tooltip></div>,
            }))}
          />
          <TablePagination page={page} pageSize={pageSize} total={listagem.data.total} onPageChange={setPage} />
        </div>
      )}
      {organizacaoAtual && <AmbienteModal open={modalOpen} organizacaoId={organizacaoAtual.id} propriedades={estrutura.data.propriedades} unidades={estrutura.data.unidades} value={editing} onClose={() => { setModalOpen(false); setEditing(null); }} onSaved={listagem.reload} />}
      <Modal open={Boolean(viewing)} title={viewing?.nome ?? "Ambiente"} description="Detalhes do ambiente" onClose={() => setViewing(null)}>
        {viewing && <DetailList items={[{ label: "Propriedade", value: propertyName(viewing.propriedade_id) }, { label: "Unidade", value: unitName(viewing.unidade_id) }, { label: "Ambiente superior", value: parentName(viewing.ambiente_pai_id) }, { label: "Status", value: viewing.ativo ? "Ativo" : "Inativo" }, { label: "Descrição", value: viewing.descricao || "Não informada" }, { label: "Criado em", value: formatDate(viewing.criado_em) }]} />}
      </Modal>
      <ConfirmationModal open={Boolean(confirming)} title="Inativar ambiente" description={`O ambiente ${confirming?.nome ?? "selecionado"} permanecerá no histórico e poderá ser reativado.`} confirmLabel="Inativar ambiente" destructive loading={Boolean(confirming && processingId === confirming.id)} onClose={() => setConfirming(null)} onConfirm={() => confirming ? changeActive(confirming, false) : undefined} />
    </div>
  );
}
