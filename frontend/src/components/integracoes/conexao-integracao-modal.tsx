import { useState } from "react";
import { salvarConexaoIntegracao } from "../../services/conexoes-integracao.service";
import type { ConexaoIntegracao, Propriedade, ProvedorIntegracao } from "../../types/database";
import { Modal } from "../ui/modal";
import { useToast } from "../ui/toast";
import { ConexaoIntegracaoForm, type ConexaoIntegracaoFormInput } from "./conexao-integracao-form";

type Props = {
  open: boolean;
  organizacaoId: string;
  propriedades: Propriedade[];
  provedores: ProvedorIntegracao[];
  value?: ConexaoIntegracao | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

export function ConexaoIntegracaoModal({ open, organizacaoId, propriedades, provedores, value, onClose, onSaved }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  async function submit(input: ConexaoIntegracaoFormInput) {
    setSubmitting(true);
    try {
      await salvarConexaoIntegracao({ id: value?.id, organizacao_id: organizacaoId, ...input });
      await onSaved();
      showToast(value ? "Conexão atualizada." : "Conexão criada.");
      onClose();
    } catch (error) {
      console.error("[Conexões de integração] Falha ao salvar", error);
      showToast(error instanceof Error ? error.message : "Não foi possível salvar a conexão.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      title={value ? "Editar conexão" : "Nova conexão"}
      description="Configuração cadastral sem credenciais ou comunicação externa."
      onClose={onClose}
    >
      <ConexaoIntegracaoForm propriedades={propriedades} provedores={provedores} value={value} onSubmit={submit} submitting={submitting} onCancel={onClose} />
    </Modal>
  );
}
