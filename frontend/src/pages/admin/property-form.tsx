import { Building2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PropertyForm } from "../../components/admin/property-form";
import { EmptyState } from "../../components/feedback/empty-state";
import { LoadingState } from "../../components/feedback/loading-state";
import { PageHeader } from "../../components/layout/page-header";
import { Card, CardContent } from "../../components/ui/card";
import { useToast } from "../../components/ui/toast";
import { usePlatformData } from "../../hooks/use-platform-data";
import { criarPropriedade, type CriarPropriedadeInput } from "../../services/propriedades.service";

export function AdminPropertyFormPage() {
  const { id: organizacaoId } = useParams(); const navigate = useNavigate(); const { data, loading } = usePlatformData(); const { showToast } = useToast(); const [submitting, setSubmitting] = useState(false);
  if (loading) return <LoadingState label="Carregando empresa" />;
  const empresa = data.organizacoes.find((item) => item.id === organizacaoId);
  if (!empresa || !organizacaoId) return <EmptyState title="Empresa não encontrada" description="Selecione uma empresa cliente válida antes de cadastrar a propriedade." icon={Building2} />;
  const currentOrganizacaoId = organizacaoId;
  async function submit(input: Omit<CriarPropriedadeInput, "organizacao_id">) { setSubmitting(true); try { const property = await criarPropriedade({ ...input, organizacao_id: currentOrganizacaoId }); showToast("Propriedade cadastrada."); navigate(`/admin/propriedades/${property.id}`, { replace: true }); } catch (error) { console.error("[Admin] Falha ao cadastrar propriedade", error); showToast(error instanceof Error ? error.message : "Não foi possível cadastrar a propriedade.", "error"); } finally { setSubmitting(false); } }
  return <div className="space-y-8"><PageHeader title="Nova propriedade" description={`Adicione uma hospedagem a ${empresa.nome_fantasia || empresa.nome}.`} breadcrumb={["Administração", "Empresas", empresa.nome_fantasia || empresa.nome, "Nova propriedade"]} /><Card><CardContent><PropertyForm onSubmit={submit} submitting={submitting} onCancel={() => navigate(`/admin/empresas/${empresa.id}`)} /></CardContent></Card></div>;
}
