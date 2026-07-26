import { useState } from "react";
import { atualizarAmbiente, criarAmbiente } from "../../services/ambientes.service";
import type { Ambiente, Propriedade, Unidade } from "../../types/database";
import { Modal } from "../ui/modal";
import { useToast } from "../ui/toast";
import { AmbienteForm, type AmbienteFormInput } from "./ambiente-form";

type Props = {
  open: boolean;
  organizacaoId: string;
  propriedades: Propriedade[];
  unidades: Unidade[];
  value?: Ambiente | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

export function AmbienteModal({ open, organizacaoId, propriedades, unidades, value, onClose, onSaved }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  async function submit(input: AmbienteFormInput) {
    setSubmitting(true);
    try {
      if (value) {
        await atualizarAmbiente({ id: value.id, unidade_id: input.unidade_id, ambiente_pai_id: input.ambiente_pai_id, nome: input.nome, descricao: input.descricao, ativo: input.ativo });
      } else {
        await criarAmbiente({ organizacao_id: organizacaoId, ...input });
      }
      await onSaved();
      showToast(value ? "Ambiente atualizado." : "Ambiente criado.");
      onClose();
    } catch (error) {
      console.error("[Ambientes] Falha ao salvar", error);
      showToast(error instanceof Error ? error.message : "Não foi possível salvar o ambiente.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} title={value ? "Editar ambiente" : "Novo ambiente"} description="Organização física da propriedade e das unidades." onClose={onClose}>
      <AmbienteForm organizacaoId={organizacaoId} propriedades={propriedades} unidades={unidades} value={value} onSubmit={submit} submitting={submitting} onCancel={onClose} />
    </Modal>
  );
}
