import { Button } from "./button";
import { Modal } from "./modal";

type ConfirmationModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  loading?: boolean;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

export function ConfirmationModal({ open, title, description, confirmLabel, loading = false, destructive = false, onConfirm, onClose }: ConfirmationModalProps) {
  return (
    <Modal open={open} title={title} description={description} onClose={loading ? () => undefined : onClose}>
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" disabled={loading} onClick={onClose}>Cancelar</Button>
        <Button type="button" variant={destructive ? "destructive" : "primary"} disabled={loading} onClick={() => void onConfirm()}>{loading ? "Processando..." : confirmLabel}</Button>
      </div>
    </Modal>
  );
}
