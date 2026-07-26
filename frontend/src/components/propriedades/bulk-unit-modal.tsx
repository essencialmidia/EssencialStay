import { Modal } from "../ui/modal";
import { BulkUnitForm } from "./bulk-unit-form";
type BulkUnitModalProps = { open: boolean; propriedadeId: string; onClose: () => void; onSaved: () => void | Promise<void> };

export function BulkUnitModal({ open, propriedadeId, onClose, onSaved }: BulkUnitModalProps) {
  return (
    <Modal open={open} title="Cadastrar unidades em lote" description="Os códigos existentes serão preservados e ignorados automaticamente." onClose={onClose}>
      <BulkUnitForm propriedadeId={propriedadeId} onCancel={onClose} onSaved={onSaved} />
    </Modal>
  );
}
