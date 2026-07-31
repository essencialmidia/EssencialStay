import { Building2, ExternalLink, Eye, MoreHorizontal, Pencil, Plus, Power, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OrganizationForm } from "../../components/admin/organization-form";
import { EmptyState } from "../../components/feedback/empty-state";
import { ErrorState } from "../../components/feedback/error-state";
import { LoadingState } from "../../components/feedback/loading-state";
import { PageHeader } from "../../components/layout/page-header";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { DataTable } from "../../components/ui/data-table";
import { DropdownMenu } from "../../components/ui/dropdown-menu";
import { Modal } from "../../components/ui/modal";
import { Tooltip } from "../../components/ui/tooltip";
import { useToast } from "../../components/ui/toast";
import { useAuth } from "../../contexts/auth-context";
import { useOrganization } from "../../contexts/organization-context";
import { usePlatformAdmin } from "../../contexts/platform-admin-context";
import { usePlatformData } from "../../hooks/use-platform-data";
import { formatDocument } from "../../lib/formatters";
import { atualizarStatusOrganizacao, salvarOrganizacao, type SalvarOrganizacaoInput } from "../../services/organizacoes.service";
import type { Organizacao } from "../../types/database";

const statusLabels = { ativo: "Ativa", suspenso: "Inativa", cancelado: "Cancelada" } as const;

export function AdminCompaniesPage() {
  const { data, loading, error, reload } = usePlatformData();
  const { canManagePlatform } = usePlatformAdmin();
  const { user } = useAuth();
  const { reloadOrganizacoes } = useOrganization();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [editing, setEditing] = useState<Organizacao | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [changingStatusId, setChangingStatusId] = useState<string | null>(null);

  if (loading) return <LoadingState label="Carregando empresas clientes" />;
  if (error) return <ErrorState title="Não foi possível carregar as empresas" description={error} onRetry={() => void reload()} />;

  const propertyCounts = data.propriedades.reduce<Record<string, number>>((counts, property) => {
    counts[property.organizacao_id] = (counts[property.organizacao_id] ?? 0) + 1;
    return counts;
  }, {});
  const propertyOrganizations = new Map(data.propriedades.map((property) => [property.id, property.organizacao_id]));
  const unitCounts = data.unidades.reduce<Record<string, number>>((counts, unit) => {
    const organizationId = propertyOrganizations.get(unit.propriedade_id);
    if (organizationId) counts[organizationId] = (counts[organizationId] ?? 0) + 1;
    return counts;
  }, {});

  async function save(input: SalvarOrganizacaoInput) {
    if (!user || !editing) return;
    setSubmitting(true);
    try {
      await salvarOrganizacao(input, user, editing.id);
      await Promise.all([reload(), reloadOrganizacoes()]);
      setEditing(null);
      showToast("Empresa cliente atualizada.");
    } catch (saveError) {
      showToast(saveError instanceof Error ? saveError.message : "Não foi possível atualizar a empresa.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function changeStatus(organization: Organizacao) {
    const nextStatus = organization.status === "ativo" ? "suspenso" : "ativo";
    setChangingStatusId(organization.id);
    try {
      await atualizarStatusOrganizacao(organization.id, nextStatus);
      await Promise.all([reload(), reloadOrganizacoes()]);
      showToast(nextStatus === "ativo" ? "Empresa reativada." : "Empresa inativada.");
    } catch (statusError) {
      showToast(statusError instanceof Error ? statusError.message : "Não foi possível alterar o status.", "error");
    } finally {
      setChangingStatusId(null);
    }
  }

  function actionsFor(organization: Organizacao) {
    return [
      { label: "Ver detalhes", icon: Eye, onClick: () => navigate(`/admin/empresas/${organization.id}`) },
      { label: "Acessar painel da empresa", icon: ExternalLink, onClick: () => navigate(`/admin/empresas/${organization.id}/painel`) },
      { label: "Editar empresa", icon: Pencil, onClick: () => setEditing(organization), separatorBefore: true },
      { label: changingStatusId === organization.id ? "Atualizando status..." : organization.status === "ativo" ? "Inativar empresa" : "Reativar empresa", icon: organization.status === "ativo" ? Power : RotateCcw, onClick: () => void changeStatus(organization), disabled: changingStatusId === organization.id, destructive: organization.status === "ativo" },
    ];
  }

  return <div className="min-w-0 space-y-8">
    <PageHeader title="Empresas clientes" description="Consulte a estrutura e acesse o painel operacional de cada empresa." actions={canManagePlatform ? <Button onClick={() => navigate("/onboarding?modo=nova-empresa")}><Plus className="size-4" />Nova empresa cliente</Button> : undefined} />
    {data.organizacoes.length === 0 ? <EmptyState title="Nenhuma empresa cliente" description="Cadastre a primeira empresa para iniciar sua estrutura operacional." icon={Building2} /> : <>
      <div className="grid gap-3 md:hidden" aria-label="Empresas clientes">
        {data.organizacoes.map((organization) => <article key={organization.id} className="min-w-0 rounded-lg border bg-card p-4 shadow-xs">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0"><h2 className="break-words text-sm font-semibold">{organization.nome_fantasia || organization.nome}</h2>{organization.nome_fantasia && organization.nome_fantasia !== organization.nome && <p className="mt-1 break-words text-xs text-muted-foreground">{organization.nome}</p>}</div>
            <Badge variant={organization.status === "ativo" ? "success" : organization.status === "suspenso" ? "warning" : "muted"}>{statusLabels[organization.status]}</Badge>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-sm"><div><dt className="text-xs text-muted-foreground">Propriedades</dt><dd className="mt-1 font-semibold tabular-nums">{propertyCounts[organization.id] ?? 0}</dd></div><div><dt className="text-xs text-muted-foreground">Unidades</dt><dd className="mt-1 font-semibold tabular-nums">{unitCounts[organization.id] ?? 0}</dd></div><div className="col-span-2 min-w-0"><dt className="text-xs text-muted-foreground">Documento</dt><dd className="mt-1 break-words">{formatDocument(organization.documento)}</dd></div></dl>
          {canManagePlatform && <div className="mt-4 flex items-center gap-2"><Button className="min-w-0 flex-1" variant="outline" onClick={() => navigate(`/admin/empresas/${organization.id}`)}><Eye className="size-4" />Ver detalhes</Button><DropdownMenu align="right" triggerAriaLabel={`Mais ações para ${organization.nome}`} trigger={<span className="grid size-10 place-items-center"><MoreHorizontal className="size-5" /></span>} items={actionsFor(organization)} /></div>}
        </article>)}
      </div>
      <DataTable className="hidden md:block"
      columns={[{ key: "nome", header: "Nome" }, { key: "fantasia", header: "Nome fantasia" }, { key: "documento", header: "Documento" }, { key: "tipo", header: "Tipo" }, { key: "propriedades", header: "Propriedades" }, { key: "unidades", header: "Unidades" }, { key: "status", header: "Status" }, { key: "acoes", header: "", className: "w-40 text-right" }]}
      rows={data.organizacoes.map((organization) => ({
        nome: <span className="font-medium">{organization.nome}</span>,
        fantasia: <span className="text-muted-foreground">{organization.nome_fantasia || "Não informado"}</span>,
        documento: <span className="text-muted-foreground">{formatDocument(organization.documento)}</span>,
        tipo: <span className="text-muted-foreground">{organization.tipo === "pessoa_juridica" ? "Pessoa jurídica" : "Pessoa física"}</span>,
        propriedades: <span className="tabular-nums">{propertyCounts[organization.id] ?? 0}</span>,
        unidades: <span className="tabular-nums">{unitCounts[organization.id] ?? 0}</span>,
        status: <Badge variant={organization.status === "ativo" ? "success" : organization.status === "suspenso" ? "warning" : "muted"}>{statusLabels[organization.status]}</Badge>,
        acoes: canManagePlatform ? <div className="flex justify-end"><Tooltip content="Ações da empresa"><span><DropdownMenu align="right" triggerAriaLabel={`Ações para ${organization.nome}`} trigger={<span className="grid size-10 place-items-center"><MoreHorizontal className="size-5" /></span>} items={actionsFor(organization)} /></span></Tooltip></div> : <span />,
      }))}
    /></>}
    <Modal open={Boolean(editing)} size="large" title="Editar empresa cliente" description="Atualize os dados cadastrais sem alterar o acesso da empresa." onClose={() => setEditing(null)}>
      <OrganizationForm value={editing} onSubmit={save} submitting={submitting} onCancel={() => setEditing(null)} />
    </Modal>
  </div>;
}
