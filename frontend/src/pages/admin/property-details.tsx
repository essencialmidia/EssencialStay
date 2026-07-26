import { Building2, CalendarDays, DoorOpen, Pencil, Plug, Plus, UsersRound, Wrench } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { EntityTabs } from "../../components/admin/entity-tabs";
import { PropertyForm } from "../../components/admin/property-form";
import { AutomationConfigForm } from "../../components/automacao/automation-config-form";
import { UnidadeModal } from "../../components/propriedades/unidade-modal";
import { EmptyState } from "../../components/feedback/empty-state";
import { LoadingState } from "../../components/feedback/loading-state";
import { PageHeader } from "../../components/layout/page-header";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { DataTable } from "../../components/ui/data-table";
import { Modal } from "../../components/ui/modal";
import { Select } from "../../components/ui/select";
import { useToast } from "../../components/ui/toast";
import { usePlatformAdmin } from "../../contexts/platform-admin-context";
import { usePlatformData } from "../../hooks/use-platform-data";
import { formatTime } from "../../lib/formatters";
import { atualizarPropriedade, type CriarPropriedadeInput } from "../../services/propriedades.service";
import { atualizarUnidade } from "../../services/unidades.service";
import { nomesStatusOperacionalUnidade, nomesTiposUnidade, type Unidade } from "../../types/database";

const tabs = [{ id: "geral", label: "Visão geral" }, { id: "unidades", label: "Unidades" }, { id: "automacao", label: "Automação" }, { id: "reservas", label: "Reservas", soon: true }, { id: "integracoes", label: "Integrações", soon: true }, { id: "equipe", label: "Equipe", soon: true }, { id: "manutencao", label: "Manutenção", soon: true }];

export function AdminPropertyDetailsPage() {
  const { id } = useParams(); const navigate = useNavigate(); const { data, loading, reload } = usePlatformData(); const { canManagePlatform } = usePlatformAdmin(); const { showToast } = useToast();
  const [tab, setTab] = useState("geral"); const [editing, setEditing] = useState(false); const [editingUnit, setEditingUnit] = useState<Unidade | null>(null); const [submitting, setSubmitting] = useState(false);
  if (loading) return <LoadingState label="Carregando propriedade" />;
  const property = data.propriedades.find((item) => item.id === id);
  if (!property) return <EmptyState title="Propriedade não encontrada" description="O cadastro não existe ou não está disponível para seu usuário." icon={Building2} />;
  const propertyId = property.id;
  const empresa = data.organizacoes.find((item) => item.id === property.organizacao_id); const units = data.unidades.filter((item) => item.propriedade_id === propertyId); const automation = data.automacoes.find((item) => item.propriedade_id === propertyId);
  async function saveProperty(input: Omit<CriarPropriedadeInput, "organizacao_id">) { setSubmitting(true); try { await atualizarPropriedade({ id: propertyId, ...input }); await reload(); setEditing(false); showToast("Propriedade atualizada."); } catch (error) { showToast(error instanceof Error ? error.message : "Não foi possível atualizar.", "error"); } finally { setSubmitting(false); } }
  async function changeActive(unit: Unidade) { try { await atualizarUnidade({ id: unit.id, ativo: !unit.ativo }); await reload(); showToast(unit.ativo ? "Unidade inativada." : "Unidade reativada."); } catch (error) { showToast(error instanceof Error ? error.message : "Não foi possível alterar a unidade.", "error"); } }
  return <div className="space-y-7"><PageHeader title={property.nome} description={`${empresa?.nome_fantasia || empresa?.nome || "Empresa"} · ${property.tipo}`} badge={property.status === "ativa" ? "Ativa" : property.status} breadcrumb={["Administração", "Propriedades", property.nome]} actions={<div className="flex flex-wrap gap-2"><Select value={property.id} onChange={(event) => navigate(`/admin/propriedades/${event.target.value}`)} aria-label="Selecionar propriedade" className="w-52">{data.propriedades.filter((item) => item.organizacao_id === property.organizacao_id).map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</Select>{canManagePlatform && <Button onClick={() => navigate(`/admin/propriedades/${property.id}/unidades/nova`)}><Plus className="size-4" />Adicionar unidade</Button>}</div>} />
    <Card><EntityTabs tabs={tabs} active={tab} onChange={setTab} /><CardContent>
      {tab === "geral" && <div className="space-y-6"><div className="flex justify-between"><div><p className="text-sm font-semibold">Dados da propriedade</p><p className="mt-1 text-sm text-muted-foreground">Cadastro e parâmetros de hospedagem.</p></div>{canManagePlatform && <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil className="size-4" />Editar</Button>}</div><dl className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"><Detail label="Empresa cliente" value={empresa?.nome_fantasia || empresa?.nome || "Não informada"} /><Detail label="Tipo" value={property.tipo} capitalize /><Detail label="Localização" value={[property.endereco, property.cidade, property.estado].filter(Boolean).join(", ") || "Não informada"} /><Detail label="Check-in" value={formatTime(property.horario_checkin)} /><Detail label="Checkout" value={formatTime(property.horario_checkout)} /><Detail label="Unidades" value={String(units.length)} /></dl></div>}
      {tab === "unidades" && (units.length === 0 ? <EmptyState compact title="Nenhuma unidade" description="Cadastre a primeira unidade desta propriedade." icon={DoorOpen} action={canManagePlatform ? <Button size="sm" onClick={() => navigate(`/admin/propriedades/${property.id}/unidades/nova`)}><Plus className="size-4" />Adicionar unidade</Button> : undefined} /> : <DataTable columns={[{ key: "nome", header: "Unidade" }, { key: "tipo", header: "Tipo" }, { key: "andar", header: "Andar" }, { key: "capacidade", header: "Máx. hóspedes" }, { key: "status", header: "Operacional" }, { key: "ativo", header: "Cadastro" }, { key: "acoes", header: "", className: "w-36 text-right" }]} rows={units.map((unit) => ({ nome: <div><p className="font-medium">{unit.nome}</p><p className="text-xs text-muted-foreground">{unit.codigo || "Sem código"}</p></div>, tipo: <span className="text-muted-foreground">{nomesTiposUnidade[unit.tipo]}</span>, andar: <span>{unit.andar || "—"}</span>, capacidade: <span className="inline-flex items-center gap-1"><UsersRound className="size-3.5" />{unit.capacidade_hospedes ?? "—"}</span>, status: <span>{nomesStatusOperacionalUnidade[unit.status_operacional]}</span>, ativo: <Badge variant={unit.ativo ? "success" : "muted"}>{unit.ativo ? "Ativa" : "Inativa"}</Badge>, acoes: canManagePlatform ? <div className="flex justify-end gap-1"><Button size="sm" variant="ghost" onClick={() => setEditingUnit(unit)}>Editar</Button><Button size="sm" variant="ghost" onClick={() => void changeActive(unit)}>{unit.ativo ? "Inativar" : "Reativar"}</Button></div> : <span /> }))} />)}
      {tab === "automacao" && <AutomationConfigForm propriedadeId={property.id} value={automation} onSaved={reload} readOnly={!canManagePlatform} />}
      {tab === "reservas" && <Soon icon={CalendarDays} title="Reservas" />}{tab === "integracoes" && <Soon icon={Plug} title="Integrações" />}{tab === "equipe" && <Soon icon={UsersRound} title="Equipe" />}{tab === "manutencao" && <Soon icon={Wrench} title="Manutenção" />}
    </CardContent></Card>
    <Modal open={editing} size="large" title="Editar propriedade" description="Atualize os dados cadastrais da hospedagem." onClose={() => setEditing(false)}><PropertyForm value={property} onSubmit={saveProperty} submitting={submitting} onCancel={() => setEditing(false)} /></Modal>
    <UnidadeModal open={Boolean(editingUnit)} propriedadeId={property.id} unidade={editingUnit} onClose={() => setEditingUnit(null)} onSaved={reload} />
  </div>;
}

function Detail({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) { return <div><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className={capitalize ? "mt-1.5 text-sm font-medium capitalize" : "mt-1.5 text-sm font-medium"}>{value}</dd></div>; }
function Soon({ icon, title }: { icon: typeof CalendarDays; title: string }) { return <EmptyState compact title={`${title} em breve`} description="A estrutura está reservada, sem integração ou regra de negócio neste sprint." icon={icon} />; }
