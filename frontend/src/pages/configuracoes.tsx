import { Building2, FileText, Mail, Pencil, Phone } from "lucide-react";
import { useState } from "react";
import { OrganizationForm } from "../components/admin/organization-form";
import { EmptyState } from "../components/feedback/empty-state";
import { PageHeader } from "../components/layout/page-header";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Modal } from "../components/ui/modal";
import { useToast } from "../components/ui/toast";
import { useAuth } from "../contexts/auth-context";
import { useOrganization } from "../contexts/organization-context";
import { formatDocument } from "../lib/formatters";
import { salvarOrganizacao, type SalvarOrganizacaoInput } from "../services/organizacoes.service";

export function ConfiguracoesPage() {
  const { user } = useAuth(); const { organizacaoAtual, reloadOrganizacoes } = useOrganization(); const { showToast } = useToast(); const [editing, setEditing] = useState(false); const [submitting, setSubmitting] = useState(false);
  if (!organizacaoAtual) return <EmptyState title="Empresa não encontrada" description="Conclua a configuração inicial para continuar." icon={Building2} />;
  const currentOrganization = organizacaoAtual;
  async function save(input: SalvarOrganizacaoInput) { if (!user) return; setSubmitting(true); try { await salvarOrganizacao(input, user, currentOrganization.id); await reloadOrganizacoes(); setEditing(false); showToast("Empresa atualizada."); } catch (error) { console.error("[Empresa] Falha ao atualizar", error); showToast(error instanceof Error ? error.message : "Não foi possível atualizar.", "error"); } finally { setSubmitting(false); } }
  const displayName = currentOrganization.nome_fantasia || currentOrganization.nome;
  return <div className="space-y-8"><PageHeader title="Empresa atual" description="Dados cadastrais e contexto da operação ativa." actions={<Button variant="outline" onClick={() => setEditing(true)}><Pencil className="size-4" />Editar empresa</Button>} />
    <Card><CardHeader><div className="flex items-center gap-4"><div className="grid size-14 place-items-center overflow-hidden rounded-lg border bg-secondary font-semibold">{organizacaoAtual.logo_url ? <img src={organizacaoAtual.logo_url} alt="" className="size-full object-cover" /> : displayName.slice(0, 2).toUpperCase()}</div><div><CardTitle>{displayName}</CardTitle><CardDescription>{organizacaoAtual.nome}</CardDescription></div><Badge className="ml-auto" variant={organizacaoAtual.status === "ativo" ? "success" : organizacaoAtual.status === "suspenso" ? "warning" : "muted"}>{organizacaoAtual.status}</Badge></div></CardHeader><CardContent className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4"><Data icon={Building2} label="Tipo" value={organizacaoAtual.tipo === "pessoa_juridica" ? "Pessoa jurídica" : "Pessoa física"} /><Data icon={FileText} label="CPF ou CNPJ" value={formatDocument(organizacaoAtual.documento)} /><Data icon={Mail} label="E-mail" value={organizacaoAtual.email || "Não informado"} /><Data icon={Phone} label="Telefone" value={organizacaoAtual.telefone || "Não informado"} /></CardContent></Card>
    <Modal open={editing} size="large" title="Editar empresa" description="Atualize o cadastro da empresa cliente atual." onClose={() => setEditing(false)}><OrganizationForm value={organizacaoAtual} onSubmit={save} submitting={submitting} onCancel={() => setEditing(false)} /></Modal>
  </div>;
}
function Data({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) { return <div className="flex gap-3"><div className="grid size-9 place-items-center rounded-md bg-secondary text-muted-foreground"><Icon className="size-4" /></div><div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div></div>; }
