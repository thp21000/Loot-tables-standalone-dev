import Modal from "./Modal";
import { buttons } from "../styles/ui";

type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel: () => void;
  customFooter?: React.ReactNode;
};

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
  customFooter,
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onCancel}
      footer={
        customFooter ?? (
          <>
            <button onClick={onConfirm} style={buttons.danger}>
              {confirmLabel}
            </button>
            <button onClick={onCancel} style={buttons.secondary}>
              {cancelLabel}
            </button>
          </>
        )
      }
    >
      <p style={{ margin: 0, textAlign: "center", lineHeight: 1.6 }}>
        {message}
      </p>
    </Modal>
  );
}