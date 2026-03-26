import Modal from "./Modal";
import { buttons } from "../styles/ui";

type AlertModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  buttonLabel?: string;
  onClose: () => void;
};

export default function AlertModal({
  isOpen,
  title,
  message,
  buttonLabel = "OK",
  onClose,
}: AlertModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onClose}
      footer={
        <button onClick={onClose} style={buttons.primary}>
          {buttonLabel}
        </button>
      }
    >
      <p style={{ margin: 0, textAlign: "center", lineHeight: 1.6 }}>
        {message}
      </p>
    </Modal>
  );
}