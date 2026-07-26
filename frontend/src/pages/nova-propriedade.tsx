import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/layout/page-header";
import { PropertyForm, type PropertyFormInput } from "../components/propriedades/property-form";
import { Card, CardContent } from "../components/ui/card";
import { useToast } from "../components/ui/toast";
import { useOrganization } from "../contexts/organization-context";
import { criarPropriedade } from "../services/propriedades.service";

export function NovaPropriedadePage() {
  const { organizacaoAtual } = useOrganization();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  async function submit(input: PropertyFormInput) {
    if (!organizacaoAtual) return;
    setSubmitting(true);
    try {
      const propriedade = await criarPropriedade({ ...input, organizacao_id: organizacaoAtual.id });
      showToast("Propriedade cadastrada. Agora organize suas unidades.");
      navigate(`/propriedades/${propriedade.id}`, { replace: true });
    } catch (error) {
      console.error("[Propriedades] Falha ao cadastrar", error);
      showToast(error instanceof Error ? error.message : "Não foi possível cadastrar a propriedade.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Nova propriedade" description={`Adicione uma hospedagem ao portfólio de ${organizacaoAtual?.nome_fantasia || organizacaoAtual?.nome || "sua empresa"}.`} breadcrumb={["Essencial Stay", "Propriedades", "Nova propriedade"]} />
      <Card><CardContent><PropertyForm onSubmit={submit} submitting={submitting} onCancel={() => navigate("/propriedades")} /></CardContent></Card>
    </div>
  );
}
