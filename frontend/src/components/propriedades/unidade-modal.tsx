import { useState } from "react";
import { atualizarUnidade, criarUnidade } from "../../services/unidades.service";
import type { Unidade } from "../../types/database";
import { Modal } from "../ui/modal";
import { useToast } from "../ui/toast";
import { UnitForm, type UnitFormInput } from "./unit-form";

type UnidadeModalProps = {
  open: boolean;
  propriedadeId: string;
  unidade?: Unidade | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

export function UnidadeModal({ open, propriedadeId, unidade, onClose, onSaved }: UnidadeModalProps) {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  async function submit(input: UnitFormInput) {
    setSubmitting(true);
    try {
      if (unidade) await atualizarUnidade({ id: unidade.id, ...input });
      else await criarUnidade({ propriedade_id: propriedadeId, ...input });
      await onSaved();
      showToast(unidade ? "Unidade atualizada." : "Unidade cadastrada.");
      onClose();
    } catch (error) {
      console.error("[Unidades] Falha ao salvar unidade", error);
      showToast(error instanceof Error ? error.message : "Não foi possível salvar a unidade.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} title={unidade ? "Editar unidade" : "Adicionar unidade"} description="A unidade será vinculada exclusivamente a esta propriedade." onClose={onClose}>
      <UnitForm value={unidade} onSubmit={submit} submitting={submitting} onCancel={onClose} />
    </Modal>
  );
}
