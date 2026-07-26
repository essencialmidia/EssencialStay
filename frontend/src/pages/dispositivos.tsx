import { BatteryMedium, Cpu, Eye, Pencil, Plus, Power, Radio, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DispositivoModal } from "../components/dispositivos/dispositivo-modal";
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
import { listarCatalogoDispositivos, listarCategoriasDispositivo } from "../services/catalogos-iot.service";
import { atualizarDispositivo, listarDispositivos } from "../services/dispositivos.service";
import { nomesStatusCadastroDispositivo, statusCadastroDispositivo, type CatalogoDispositivo, type CategoriaDispositivo, type Dispositivo, type Pagina, type StatusCadastroDispositivo } from "../types/database";

const pageSize = 25;
const badgeCadastro: Record<StatusCadastroDispositivo, "success" | "warning" | "muted"> = { ativo: "success", inativo: "muted", manutencao: "warning" };

export function DispositivosPage() {
  const { organizacaoAtual } = useOrganization();
  const estrutura = useDashboardData(organizacaoAtual?.id);
  const { showToast } = useToast();
  const [catalogo, setCatalogo] = useState<CatalogoDispositivo[]>([]);
  const [categorias, setCategorias] = useState<CategoriaDispositivo[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [categoryFilter, setCategoryFilter] = useState("todos");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Dispositivo | null>(null);
  const [viewing, setViewing] = useState<Dispositivo | null>(null);
  const [confirming, setConfirming] = useState<Dispositivo | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  const loadCatalogs = useCallback(async () => {
    try {
      setCatalogError(null);
      const [catalogItems, categoryItems] = await Promise.all([listarCatalogoDispositivos(), listarCategoriasDispositivo()]);
      setCatalogo(catalogItems);
      setCategorias(categoryItems);
    } catch (loadError) {
      setCatalogError(loadError instanceof Error ? loadError.message : "Não foi possível carregar os catálogos.");
    }
  }, []);
  useEffect(() => { void loadCatalogs(); }, [loadCatalogs]);
  useEffect(() => { setPage(1); }, [categoryFilter, debouncedSearch, propertyFilter, statusFilter]);

  const load = useCallback(async (): Promise<Pagina<Dispositivo>> => {
    if (!organizacaoAtual) return { itens: [], total: 0, pagina: 1, tamanhoPagina: pageSize };
    return listarDispositivos({
      organizacaoId: organizacaoAtual.id,
      busca: debouncedSearch,
      propriedadeId: propertyFilter === "todos" ? undefined : propertyFilter,
      categoriaId: categoryFilter === "todos" ? undefined : categoryFilter,
      status: statusFilter === "todos" ? undefined : statusFilter as StatusCadastroDispositivo,
      pagina: page,
      tamanhoPagina: pageSize,
    });
  }, [categoryFilter, debouncedSearch, organizacaoAtual, page, propertyFilter, statusFilter]);

  const listagem = usePaginatedQuery(load);
  const catalogById = useMemo(() => new Map(catalogo.map((item) => [item.id, item])), [catalogo]);
  const propertyName = (id: string) => estrutura.data.propriedades.find((item) => item.id === id)?.nome_fantasia || estrutura.data.propriedades.find((item) => item.id === id)?.nome || "Propriedade não encontrada";

  async function changeActive(item: Dispositivo, active: boolean) {
    setProcessingId(item.id);
    try {
      await atualizarDispositivo({ id: item.id, status_cadastro: active ? "ativo" : "inativo" });
      await listagem.reload();
      setConfirming(null);
      showToast(active ? "Dispositivo reativado." : "Dispositivo inativado.");
    } catch (changeError) {
      showToast(changeError instanceof Error ? changeError.message : "Não foi possível alterar o dispositivo.", "error");
    } finally {
      setProcessingId(null);
    }
  }

  const onlineLabel = (item: Dispositivo) => item.estado_atual?.online === true ? "Online" : item.estado_atual?.online === false ? "Offline" : "Sem telemetria";
  const onlineVariant = (item: Dispositivo): "success" | "muted" | "outline" => item.estado_atual?.online === true ? "success" : item.estado_atual?.online === false ? "muted" : "outline";

  if (estrutura.loading || listagem.loading) return <LoadingState label="Carregando dispositivos" />;
  const error = estrutura.error || listagem.error || catalogError;
  if (error) return <ErrorState description={error} onRetry={() => { void estrutura.reload(); void listagem.reload(); void loadCatalogs(); }} />;

  return (
    <div className="space-y-8">
      <PageHeader title="Dispositivos" description={`Inventário técnico independente de fabricante de ${organizacaoAtual?.nome_fantasia || organizacaoAtual?.nome}.`} actions={<Button disabled={estrutura.data.propriedades.length === 0} onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="size-4" />Novo dispositivo</Button>} />
      <EntityToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Buscar dispositivo">
        <Select value={propertyFilter} onChange={(event) => setPropertyFilter(event.target.value)}>
          <option value="todos">Todas as propriedades</option>
          {estrutura.data.propriedades.map((item) => <option key={item.id} value={item.id}>{item.nome_fantasia || item.nome}</option>)}
        </Select>
        <Select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value="todos">Todas as categorias</option>
          {categorias.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
        </Select>
        <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="todos">Todas as situações</option>
          {statusCadastroDispositivo.map((item) => <option key={item} value={item}>{nomesStatusCadastroDispositivo[item]}</option>)}
        </Select>
      </EntityToolbar>
      {listagem.data.itens.length === 0 ? (
        <EmptyState title="Nenhum dispositivo cadastrado." description={estrutura.data.propriedades.length === 0 ? "Cadastre uma propriedade antes de criar dispositivos." : "Cadastre manualmente um dispositivo ou utilize uma integração para importá-los automaticamente."} icon={Cpu} action={estrutura.data.propriedades.length > 0 ? <Button size="sm" onClick={() => setModalOpen(true)}><Plus className="size-4" />Novo dispositivo</Button> : undefined} />
      ) : (
        <div className="space-y-4">
          <DataTable
            columns={[{ key: "nome", header: "Dispositivo" }, { key: "local", header: "Propriedade / ambiente" }, { key: "modelo", header: "Fabricante / modelo" }, { key: "origem", header: "Origem" }, { key: "cadastro", header: "Cadastro" }, { key: "estado", header: "Estado observado" }, { key: "telemetria", header: "Bateria / sinal" }, { key: "acoes", header: "", className: "w-32 text-right" }]}
            rows={listagem.data.itens.map((item) => ({
              nome: <div><p className="font-medium">{item.nome}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.numero_serie || "Sem número de série"}</p></div>,
              local: <div><p>{propertyName(item.propriedade_id)}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.ambiente?.nome || "Sem ambiente"}</p></div>,
              modelo: <div><p>{item.fabricante || "Não informado"}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.modelo || "Modelo não informado"}</p></div>,
              origem: <span className="text-muted-foreground">{item.origens.length > 0 ? `${item.origens.length} externa${item.origens.length === 1 ? "" : "s"}` : "Cadastro manual"}</span>,
              cadastro: <Badge variant={badgeCadastro[item.status_cadastro]}>{nomesStatusCadastroDispositivo[item.status_cadastro]}</Badge>,
              estado: <Badge variant={onlineVariant(item)}>{onlineLabel(item)}</Badge>,
              telemetria: <span className="inline-flex items-center gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><BatteryMedium className="size-3.5" />{item.estado_atual?.nivel_bateria ?? "—"}{item.estado_atual?.nivel_bateria !== null && item.estado_atual?.nivel_bateria !== undefined ? "%" : ""}</span><span className="inline-flex items-center gap-1"><Radio className="size-3.5" />{item.estado_atual?.intensidade_sinal ?? "—"}</span></span>,
              acoes: <div className="flex justify-end gap-1"><Tooltip content="Visualizar"><Button size="icon" className="size-8" variant="ghost" onClick={() => setViewing(item)}><Eye className="size-4" /></Button></Tooltip><Tooltip content="Editar"><Button size="icon" className="size-8" variant="ghost" onClick={() => { setEditing(item); setModalOpen(true); }}><Pencil className="size-4" /></Button></Tooltip><Tooltip content={item.status_cadastro === "inativo" ? "Reativar" : "Inativar"}><Button size="icon" className="size-8" variant="ghost" disabled={processingId === item.id} onClick={() => item.status_cadastro === "inativo" ? void changeActive(item, true) : setConfirming(item)}>{item.status_cadastro === "inativo" ? <RotateCcw className="size-4" /> : <Power className="size-4" />}</Button></Tooltip></div>,
            }))}
          />
          <TablePagination page={page} pageSize={pageSize} total={listagem.data.total} onPageChange={setPage} />
        </div>
      )}
      {organizacaoAtual && <DispositivoModal open={modalOpen} organizacaoId={organizacaoAtual.id} propriedades={estrutura.data.propriedades} catalogo={catalogo} value={editing} onClose={() => { setModalOpen(false); setEditing(null); }} onSaved={listagem.reload} />}
      <Modal open={Boolean(viewing)} size="large" title={viewing?.nome ?? "Dispositivo"} description="Cadastro interno e estado observado" onClose={() => setViewing(null)}>
        {viewing && <DetailList items={[{ label: "Propriedade", value: propertyName(viewing.propriedade_id) }, { label: "Ambiente", value: viewing.ambiente?.nome || "Sem ambiente" }, { label: "Origem", value: viewing.origens.length > 0 ? "Identidade externa vinculada" : "Cadastro manual" }, { label: "Fabricante", value: viewing.fabricante || "Não informado" }, { label: "Modelo", value: viewing.modelo || "Não informado" }, { label: "Número de série", value: viewing.numero_serie || "Não informado" }, { label: "Firmware", value: viewing.versao_firmware || "Não informado" }, { label: "Situação cadastral", value: nomesStatusCadastroDispositivo[viewing.status_cadastro] }, { label: "Estado observado", value: onlineLabel(viewing) }, { label: "Bateria", value: viewing.estado_atual?.nivel_bateria == null ? "Não informada" : `${viewing.estado_atual.nivel_bateria}%` }, { label: "Sinal", value: viewing.estado_atual?.intensidade_sinal ?? "Não informado" }, { label: "Cadastrado em", value: formatDate(viewing.criado_em) }, { label: "Categoria", value: viewing.catalogo_id ? catalogById.get(viewing.catalogo_id)?.categoria.nome || "Não informada" : "Não informada" }, { label: "Protocolos", value: viewing.catalogo_id ? catalogById.get(viewing.catalogo_id)?.protocolos.map((item) => item.protocolo.nome).join(", ") || "Não informados" : "Não informados" }]} />}
      </Modal>
      <ConfirmationModal open={Boolean(confirming)} title="Inativar dispositivo" description={`O dispositivo ${confirming?.nome ?? "selecionado"} permanecerá cadastrado e poderá ser reativado.`} confirmLabel="Inativar dispositivo" destructive loading={Boolean(confirming && processingId === confirming.id)} onClose={() => setConfirming(null)} onConfirm={() => confirming ? changeActive(confirming, false) : undefined} />
    </div>
  );
}
