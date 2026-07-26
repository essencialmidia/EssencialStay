import { Building2, Mail, Pencil, Plus, UsersRound } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { EntityTabs } from "../../components/admin/entity-tabs";
import { OrganizationForm } from "../../components/admin/organization-form";
import { EmptyState } from "../../components/feedback/empty-state";
import { LoadingState } from "../../components/feedback/loading-state";
import { PageHeader } from "../../components/layout/page-header";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { DataTable } from "../../components/ui/data-table";
import { Modal } from "../../components/ui/modal";
import { useToast } from "../../components/ui/toast";
import { useAuth } from "../../contexts/auth-context";
import { useOrganization } from "../../contexts/organization-context";
import { usePlatformAdmin } from "../../contexts/platform-admin-context";
import { usePlatformData } from "../../hooks/use-platform-data";
import { formatDate, formatDocument } from "../../lib/formatters";
import { salvarOrganizacao, type SalvarOrganizacaoInput } from "../../services/organizacoes.service";

const tabs = [{ id: "geral", label: "Visão geral" }, { id: "propriedades", label: "Propriedades" }, { id: "usuarios", label: "Usuários" }, { id: "plano", label: "Plano", soon: true }, { id: "integracoes", label: "Integrações", soon: true }, { id: "historico", label: "Histórico", soon: true }];

export function AdminCompanyDetailsPage() {
  const { id } = useParams(); const navigate = useNavigate(); const { data, loading, reload } = usePlatformData();
  const { user } = useAuth(); const { reloadOrganizacoes, setOrganizacaoAtualId } = useOrganization(); const { canManagePlatform } = usePlatformAdmin(); const { showToast } = useToast();
  const [tab, setTab] = useState("geral"); const [editing, setEditing] = useState(false); const [submitting, setSubmitting] = useState(false);
  if (loading) return <LoadingState label="Carregando empresa" />;
  const empresa = data.organizacoes.find((item) => item.id === id);
  if (!empresa) return <EmptyState title="Empresa não encontrada" description="O cadastro não existe ou não está disponível para seu usuário." icon={Building2} />;
  const empresaId = empresa.id;
  const propriedades = data.propriedades.filter((item) => item.organizacao_id === empresaId);
  const membros = data.membros.filter((item) => item.organizacao_id === empresaId);
  async function save(input: SalvarOrganizacaoInput) { if (!user) return; setSubmitting(true); try { await salvarOrganizacao(input, user, empresaId); await Promise.all([reload(), reloadOrganizacoes()]); setEditing(false); showToast("Empresa atualizada."); } catch (error) { showToast(error instanceof Error ? error.message : "Não foi possível atualizar.", "error"); } finally { setSubmitting(false); } }
  function enterOperation() { setOrganizacaoAtualId(empresaId); navigate("/dashboard"); }
  return <div className="space-y-7"><PageHeader title={empresa.nome_fantasia || empresa.nome} description={empresa.nome} badge={empresa.status === "ativo" ? "Ativa" : empresa.status} breadcrumb={["Administração", "Empresas", empresa.nome_fantasia || empresa.nome]} actions={<><Button variant="outline" onClick={enterOperation}>Abrir operação</Button>{canManagePlatform && <Button onClick={() => navigate(`/admin/empresas/${empresa.id}/propriedades/nova`)}><Plus className="size-4" />Adicionar propriedade</Button>}</>} />
    <Card><EntityTabs tabs={tabs} active={tab} onChange={setTab} /><CardContent>
      {tab === "geral" && <div className="space-y-6"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold">Dados cadastrais</p><p className="mt-1 text-sm text-muted-foreground">Informações oficiais da empresa cliente.</p></div>{canManagePlatform && <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil className="size-4" />Editar</Button>}</div><dl className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"><Detail label="Tipo" value={empresa.tipo === "pessoa_juridica" ? "Pessoa jurídica" : "Pessoa física"} /><Detail label="CPF ou CNPJ" value={formatDocument(empresa.documento)} /><Detail label="E-mail" value={empresa.email || "Não informado"} /><Detail label="Telefone" value={empresa.telefone || "Não informado"} /><Detail label="Cadastro" value={formatDate(empresa.criado_em)} /><Detail label="Propriedades" value={String(propriedades.length)} /></dl></div>}
      {tab === "propriedades" && (propriedades.length === 0 ? <EmptyState compact title="Nenhuma propriedade" description="Adicione a primeira hospedagem desta empresa." icon={Building2} action={canManagePlatform ? <Button size="sm" onClick={() => navigate(`/admin/empresas/${empresa.id}/propriedades/nova`)}><Plus className="size-4" />Adicionar propriedade</Button> : undefined} /> : <DataTable columns={[{ key: "nome", header: "Propriedade" }, { key: "tipo", header: "Tipo" }, { key: "local", header: "Localização" }, { key: "unidades", header: "Unidades" }, { key: "status", header: "Status" }]} rows={propriedades.map((property) => ({ nome: <button className="font-medium hover:underline" type="button" onClick={() => navigate(`/admin/propriedades/${property.id}`)}>{property.nome}</button>, tipo: <span className="capitalize text-muted-foreground">{property.tipo}</span>, local: <span className="text-muted-foreground">{[property.cidade, property.estado].filter(Boolean).join(" / ") || "Não informada"}</span>, unidades: <span>{data.unidades.filter((unit) => unit.propriedade_id === property.id).length}</span>, status: <Badge variant={property.status === "ativa" ? "success" : "muted"}>{property.status}</Badge> }))} />)}
      {tab === "usuarios" && (membros.length === 0 ? <EmptyState compact title="Nenhum usuário vinculado" description="A gestão de convites será adicionada futuramente." icon={UsersRound} /> : <DataTable columns={[{ key: "usuario", header: "Usuário" }, { key: "papel", header: "Papel" }, { key: "status", header: "Status" }]} rows={membros.map((member) => { const perfil = data.perfis.find((item) => item.id === member.perfil_id); return { usuario: <div><p className="font-medium">{perfil?.nome_completo || "Perfil sem nome"}</p><p className="text-xs text-muted-foreground">{member.perfil_id}</p></div>, papel: <span className="capitalize text-muted-foreground">{member.papel}</span>, status: <Badge variant={member.ativo ? "success" : "muted"}>{member.ativo ? "Ativo" : "Inativo"}</Badge> }; })} />)}
      {["plano", "integracoes", "historico"].includes(tab) && <EmptyState compact title="Em breve" description="Esta seção está preparada visualmente para um próximo sprint." icon={tab === "integracoes" ? Mail : Building2} />}
    </CardContent></Card>
    <Modal open={editing} size="large" title="Editar empresa cliente" description="Atualize os dados cadastrais do tenant." onClose={() => setEditing(false)}><OrganizationForm value={empresa} onSubmit={save} submitting={submitting} onCancel={() => setEditing(false)} /></Modal>
  </div>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="mt-1.5 text-sm font-medium">{value}</dd></div>; }
