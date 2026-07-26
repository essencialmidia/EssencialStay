import { Building2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { UnitForm } from "../../components/admin/unit-form";
import { EmptyState } from "../../components/feedback/empty-state";
import { LoadingState } from "../../components/feedback/loading-state";
import { PageHeader } from "../../components/layout/page-header";
import { Card, CardContent } from "../../components/ui/card";
import { useToast } from "../../components/ui/toast";
import { usePlatformData } from "../../hooks/use-platform-data";
import { criarUnidade, type CriarUnidadeInput } from "../../services/unidades.service";

export function AdminUnitFormPage() {
  const { id: propriedadeId } = useParams(); const navigate = useNavigate(); const { data, loading } = usePlatformData(); const { showToast } = useToast(); const [submitting, setSubmitting] = useState(false);
  if (loading) return <LoadingState label="Carregando propriedade" />;
  const propriedade = data.propriedades.find((item) => item.id === propriedadeId);
  if (!propriedade || !propriedadeId) return <EmptyState title="Propriedade não encontrada" description="Selecione uma propriedade válida antes de cadastrar a unidade." icon={Building2} />;
  const currentPropriedadeId = propriedadeId;
  async function submit(input: Omit<CriarUnidadeInput, "propriedade_id">) { setSubmitting(true); try { await criarUnidade({ ...input, propriedade_id: currentPropriedadeId }); showToast("Unidade cadastrada."); navigate(`/admin/propriedades/${currentPropriedadeId}`, { replace: true }); } catch (error) { console.error("[Admin] Falha ao cadastrar unidade", error); showToast(error instanceof Error ? error.message : "Não foi possível cadastrar a unidade.", "error"); } finally { setSubmitting(false); } }
  return <div className="space-y-8"><PageHeader title="Nova unidade" description={`Cadastre uma unidade em ${propriedade.nome}.`} breadcrumb={["Administração", "Propriedades", propriedade.nome, "Nova unidade"]} /><Card><CardContent><UnitForm onSubmit={submit} submitting={submitting} onCancel={() => navigate(`/admin/propriedades/${propriedade.id}`)} /></CardContent></Card></div>;
}
