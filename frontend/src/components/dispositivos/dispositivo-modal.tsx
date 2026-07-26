import { useState } from "react";
import { atualizarDispositivo, criarDispositivo } from "../../services/dispositivos.service";
import type { CatalogoDispositivo, Dispositivo, Propriedade } from "../../types/database";
import { Modal } from "../ui/modal";
import { useToast } from "../ui/toast";
import { DispositivoForm, type DispositivoFormInput } from "./dispositivo-form";

type Props = {
  open: boolean;
  organizacaoId: string;
  propriedades: Propriedade[];
  catalogo: CatalogoDispositivo[];
  value?: Dispositivo | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

export function DispositivoModal({ open, organizacaoId, propriedades, catalogo, value, onClose, onSaved }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  async function submit(input: DispositivoFormInput) {
    setSubmitting(true);
    try {
      if (value) {
        const { propriedade_id: _propriedadeId, ...update } = input;
        await atualizarDispositivo({ id: value.id, ...update });
      } else {
        await criarDispositivo({ organizacao_id: organizacaoId, ...input });
      }
      await onSaved();
      showToast(value ? "Dispositivo atualizado." : "Dispositivo criado.");
      onClose();
    } catch (error) {
      console.error("[Dispositivos] Falha ao salvar", error);
      showToast(error instanceof Error ? error.message : "Não foi possível salvar o dispositivo.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} size="large" title={value ? "Editar dispositivo" : "Novo dispositivo"} description="Inventário interno sem dependência de fornecedor." onClose={onClose}>
      <DispositivoForm organizacaoId={organizacaoId} propriedades={propriedades} catalogo={catalogo} value={value} onSubmit={submit} submitting={submitting} onCancel={onClose} />
    </Modal>
  );
}
