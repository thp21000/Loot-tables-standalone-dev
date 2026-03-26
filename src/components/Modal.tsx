type ModalProps = {
  isOpen: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
};

export default function Modal({
  isOpen,
  title,
  children,
  onClose,
  footer,
}: ModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        zIndex: 2000,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "#1e1e1e",
          border: "1px solid #444",
          borderRadius: "14px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: title ? "1px solid #333" : "none",
          }}
        >
          {title ? (
            <h2 style={{ margin: 0, fontSize: "1.2rem", textAlign: "center" }}>
              {title}
            </h2>
          ) : null}
        </div>

        <div style={{ padding: "20px" }}>{children}</div>

        {footer ? (
          <div
            style={{
              padding: "16px 20px",
              borderTop: "1px solid #333",
              display: "flex",
              justifyContent: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}