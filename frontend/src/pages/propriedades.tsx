import { Building2, Eye, Pencil, Plus, Power, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../components/feedback/empty-state";
import { ErrorState } from "../components/feedback/error-state";
import { LoadingState } from "../components/feedback/loading-state";
import { PageHeader } from "../components/layout/page-header";
import { PropriedadeModal } from "../components/propriedades/propriedade-modal";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ConfirmationModal } from "../components/ui/confirmation-modal";
import { DataTable } from "../components/ui/data-table";
import { Tooltip } from "../components/ui/tooltip";
import { useToast } from "../components/ui/toast";
import { useOrganization } from "../contexts/organization-context";
import { useDashboardData } from "../hooks/use-dashboard-data";
import { formatDate, formatDocument } from "../lib/formatters";
import { alterarStatusPropriedade } from "../services/propriedades.service";
import { nomesTiposPropriedade, type Propriedade } from "../types/database";

export function PropriedadesPage() {
  const { organizacaoAtual } = useOrganization();
  const { data, loading, error, reload } = useDashboardData(organizacaoAtual?.id);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [editing, setEditing] = useState<Propriedade | null>(null);
  const [confirming, setConfirming] = useState<Propriedade | null>(null);
  const [changingStatusId, setChangingStatusId] = useState<string | null>(null);

  const totalUnitCounts = data.unidades.reduce<Record<string, number>>((counts, unidade) => {
    counts[unidade.propriedade_id] = (counts[unidade.propriedade_id] ?? 0) + 1;
    return counts;
  }, {});
  const activeUnitCounts = data.unidades.filter((unidade) => unidade.ativo).reduce<Record<string, number>>((counts, unidade) => {
    counts[unidade.propriedade_id] = (counts[unidade.propriedade_id] ?? 0) + 1;
    return counts;
  }, {});

  async function changeStatus(propriedade: Propriedade, status: "ativa" | "inativa") {
    setChangingStatusId(propriedade.id);
    try {
      await alterarStatusPropriedade(propriedade.id, status);
      await reload();
      setConfirming(null);
      showToast(status === "ativa" ? "Propriedade reativada." : "Propriedade inativada.");
    } catch (statusError) {
      showToast(statusError instanceof Error ? statusError.message : "Não foi possível alterar o status.", "error");
    } finally {
      setChangingStatusId(null);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Propriedades"
        description={`Portfólio de ${organizacaoAtual?.nome_fantasia || organizacaoAtual?.nome || "sua empresa"}.`}
        actions={<Button onClick={() => navigate("/propriedades/nova")}><Plus className="size-4" />Nova propriedade</Button>}
      />

      {loading && <LoadingState label="Carregando propriedades" />}
      {error && <ErrorState description={error} onRetry={() => void reload()} />}
      {!loading && !error && data.propriedades.length === 0 && (
        <EmptyState title="Nenhuma propriedade" description="Cadastre a primeira propriedade da empresa atual." icon={Building2} action={<Button size="sm" onClick={() => navigate("/propriedades/nova")}><Plus className="size-4" />Nova propriedade</Button>} />
      )}
      {!loading && !error && data.propriedades.length > 0 && (
        <DataTable
          columns={[
            { key: "nome", header: "Propriedade" },
            { key: "tipo", header: "Tipo" },
            { key: "localizacao", header: "Localização" },
            { key: "unidades", header: "Unidades" },
            { key: "status", header: "Status" },
            { key: "criada", header: "Criação" },
            { key: "acoes", header: "", className: "w-32 text-right" },
          ]}
          rows={data.propriedades.map((propriedade) => ({
            nome: <div><button type="button" className="font-medium hover:underline" onClick={() => navigate(`/propriedades/${propriedade.id}`)}>{propriedade.nome}</button><p className="mt-0.5 text-xs text-muted-foreground">{propriedade.nome_fantasia || formatDocument(propriedade.documento)}</p></div>,
            tipo: <span className="text-muted-foreground">{nomesTiposPropriedade[propriedade.tipo]}</span>,
            localizacao: <div><p>{[propriedade.cidade, propriedade.estado].filter(Boolean).join(" / ") || "Não informada"}</p><p className="mt-0.5 max-w-52 truncate text-xs text-muted-foreground">{propriedade.endereco || "Endereço não informado"}</p></div>,
            unidades: <div><p className="tabular-nums">{activeUnitCounts[propriedade.id] ?? 0} ativas</p>{(totalUnitCounts[propriedade.id] ?? 0) > (activeUnitCounts[propriedade.id] ?? 0) && <p className="mt-0.5 text-xs text-muted-foreground">{totalUnitCounts[propriedade.id]} cadastradas</p>}</div>,
            status: <Badge variant={propriedade.status === "ativa" ? "success" : "muted"}>{propriedade.status === "ativa" ? "Ativa" : "Inativa"}</Badge>,
            criada: <span className="text-muted-foreground">{formatDate(propriedade.criado_em)}</span>,
            acoes: <div className="flex justify-end gap-1">
              <Tooltip content="Abrir detalhes"><Button size="icon" className="size-8" variant="ghost" onClick={() => navigate(`/propriedades/${propriedade.id}`)} aria-label={`Abrir ${propriedade.nome}`}><Eye className="size-4" /></Button></Tooltip>
              <Tooltip content="Editar"><Button size="icon" className="size-8" variant="ghost" onClick={() => setEditing(propriedade)} aria-label={`Editar ${propriedade.nome}`}><Pencil className="size-4" /></Button></Tooltip>
              <Tooltip content={propriedade.status === "ativa" ? "Inativar" : "Reativar"}><Button size="icon" className="size-8" variant="ghost" disabled={changingStatusId === propriedade.id} onClick={() => propriedade.status === "ativa" ? setConfirming(propriedade) : void changeStatus(propriedade, "ativa")} aria-label={`${propriedade.status === "ativa" ? "Inativar" : "Reativar"} ${propriedade.nome}`}>{propriedade.status === "ativa" ? <Power className="size-4" /> : <RotateCcw className="size-4" />}</Button></Tooltip>
            </div>,
          }))}
        />
      )}

      {editing && <PropriedadeModal open organizacaoId={editing.organizacao_id} propriedade={editing} automacao={data.automacoes.find((item) => item.propriedade_id === editing.id)} unidades={data.unidades.filter((item) => item.propriedade_id === editing.id)} onClose={() => setEditing(null)} onSaved={reload} onAutomationSaved={reload} onUnitsSaved={reload} />}
      <ConfirmationModal open={Boolean(confirming)} title="Inativar propriedade" description={`A propriedade ${confirming?.nome ?? "selecionada"} permanecerá no histórico e poderá ser reativada.`} confirmLabel="Inativar propriedade" destructive loading={Boolean(confirming && changingStatusId === confirming.id)} onClose={() => setConfirming(null)} onConfirm={() => confirming ? changeStatus(confirming, "inativa") : undefined} />
    </div>
  );
}
