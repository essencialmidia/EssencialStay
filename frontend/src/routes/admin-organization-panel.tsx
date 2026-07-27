import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { LoadingState } from "../components/feedback/loading-state";
import { useOrganization } from "../contexts/organization-context";

export function AdminOrganizationPanel() {
  const { organizacaoId } = useParams();
  const { loading, organizacoesAtivas, organizacaoAdministrativa, selecionarOrganizacaoAdministrativa } = useOrganization();
  const organizationExists = Boolean(organizacaoId && organizacoesAtivas.some((item) => item.id === organizacaoId));

  useEffect(() => {
    if (organizacaoId && organizationExists) selecionarOrganizacaoAdministrativa(organizacaoId);
  }, [organizationExists, organizacaoId, selecionarOrganizacaoAdministrativa]);

  if (loading) return <LoadingState label="Validando empresa selecionada" />;
  if (!organizationExists) return <Navigate to="/admin/empresas" replace />;
  if (organizacaoAdministrativa?.id !== organizacaoId) return <LoadingState label="Abrindo painel da empresa" />;
  return <Navigate to="/dashboard" replace />;
}
