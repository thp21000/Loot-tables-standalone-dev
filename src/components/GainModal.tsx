import Modal from "./Modal";
import type { OwlbearPlayerRole, ValidatedRollSummary } from "../types";
import { buttons, colors, radius } from "../styles/ui";

type GainModalProps = {
  isOpen: boolean;
  summary: ValidatedRollSummary | null;
  onClose: () => void;
  playerRole: OwlbearPlayerRole;
};

function getRarityColor(rarity: string): string {
  if (rarity === "Courant") return "#9ca3af";
  if (rarity === "Peu courant") return "#f59e0b";
  if (rarity === "Rare") return "#60a5fa";
  return "#a78bfa";
}

export default function GainModal({
  isOpen,
  summary,
  onClose,
  playerRole,
}: GainModalProps) {
  if (!isOpen || !summary) {
    return null;
  }

  const title = playerRole === "GM" ? "Tirage validé" : "Butin trouvé";

  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onClose}
      footer={
        <button onClick={onClose} style={buttons.primary}>
          Fermer
        </button>
      }
    >
      <div style={{ display: "grid", gap: "14px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>
            {summary.tableName}
          </div>
          <div style={{ color: colors.textMuted, marginTop: "6px" }}>
            {playerRole === "GM"
              ? summary.validatedBy
                ? `Tu as partagé ce tirage en tant que ${summary.validatedBy}`
                : "Tu as partagé ce tirage"
              : summary.validatedBy
              ? `${summary.validatedBy} a validé ce tirage`
              : "Un tirage a été validé"}
          </div>
          <div style={{ color: colors.textMuted, marginTop: "4px" }}>
            {new Date(summary.validatedAt).toLocaleString()}
          </div>
        </div>

        {summary.items.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: colors.textSoft,
              padding: "10px",
              border: `1px solid ${colors.borderSoft}`,
              borderRadius: radius.md,
              background: colors.panelBg,
            }}
          >
            Aucun objet trouvé.
          </div>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {summary.items.map((item, index) => (
              <div
                key={`${summary.validatedAt}-${item.name}-${index}`}
                style={{
                  border: `1px solid ${colors.borderSoft}`,
                  borderRadius: radius.md,
                  padding: "12px",
                  background: colors.cardBgAlt,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{item.name}</div>
                  <div style={{ color: colors.textMuted }}>
                    {item.valueAmount} {item.valueCurrency}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                    marginTop: "8px",
                    color: colors.textSoft,
                  }}
                >
                  <span>Niveau {item.level}</span>
                  <span>{item.category}</span>
                  <span
                    style={{
                      color: getRarityColor(item.rarity),
                      fontWeight: 700,
                    }}
                  >
                    {item.rarity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}