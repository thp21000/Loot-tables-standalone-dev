export const colors = {
  pageBg: "#111214",
  panelBg: "#181a1f",
  cardBg: "#1d2026",
  cardBgAlt: "#22262d",
  border: "#343a46",
  borderSoft: "#2a2f38",
  text: "#f3f4f6",
  textSoft: "#c7cbd3",
  textMuted: "#9aa3af",
  primary: "#2563eb",
  primaryHover: "#1d4ed8",
  success: "#16a34a",
  successHover: "#15803d",
  danger: "#dc2626",
  dangerHover: "#b91c1c",
  secondary: "#374151",
  secondaryHover: "#4b5563",
};

export const radius = {
  sm: "8px",
  md: "12px",
  lg: "16px",
  pill: "999px",
};

export const shadows = {
  card: "0 8px 22px rgba(0, 0, 0, 0.22)",
  modal: "0 18px 48px rgba(0, 0, 0, 0.38)",
  glowSuccess: "0 0 14px rgba(22, 163, 74, 0.35)",
};

export const layout = {
  page: {
    padding: "20px",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    maxWidth: "1200px",
    margin: "0 auto",
    color: colors.text,
    background: colors.pageBg,
    minHeight: "100vh",
    boxSizing: "border-box" as const,
  },

  topBar: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap" as const,
    marginBottom: "18px",
  },

  toolbarCard: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap" as const,
    alignItems: "center",
    marginBottom: "16px",
    padding: "14px",
    border: `1px solid ${colors.borderSoft}`,
    borderRadius: radius.lg,
    background: colors.panelBg,
    boxShadow: shadows.card,
  },

  card: {
    border: `1px solid ${colors.border}`,
    borderRadius: radius.lg,
    padding: "16px",
    background: colors.cardBg,
    boxShadow: shadows.card,
  },

  sectionCard: {
    border: `1px solid ${colors.borderSoft}`,
    borderRadius: radius.md,
    padding: "12px",
    background: colors.panelBg,
  },

  rowWrap: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap" as const,
    alignItems: "center",
  },

  centerRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap" as const,
    alignItems: "center",
    justifyContent: "center",
  },
};

export const typography = {
  pageTitle: {
    margin: "0 0 8px 0",
    textAlign: "center" as const,
    fontSize: "2rem",
    fontWeight: 800,
    letterSpacing: "-0.02em",
  },

  pageSubtitle: {
    margin: "0 0 18px 0",
    textAlign: "center" as const,
    color: colors.textMuted,
  },

  cardTitle: {
    margin: "0 0 8px 0",
    textAlign: "center" as const,
    fontSize: "1.2rem",
    fontWeight: 700,
  },

  label: {
    display: "block",
    marginBottom: "6px",
    color: colors.textSoft,
    fontWeight: 600,
  },

  muted: {
    color: colors.textMuted,
  },
};

export const controls = {
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
    background: "#111318",
    color: colors.text,
    boxSizing: "border-box" as const,
    outline: "none",
  },

  textarea: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
    background: "#111318",
    color: colors.text,
    boxSizing: "border-box" as const,
    outline: "none",
    resize: "vertical" as const,
  },

  select: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
    background: "#111318",
    color: colors.text,
    boxSizing: "border-box" as const,
    outline: "none",
  },
};

export const buttons = {
  primary: {
    padding: "10px 14px",
    borderRadius: radius.md,
    border: "none",
    background: colors.primary,
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
  },

  secondary: {
    padding: "10px 14px",
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
    background: colors.secondary,
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
  },

  danger: {
    padding: "10px 14px",
    borderRadius: radius.md,
    border: "none",
    background: colors.danger,
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
  },

  ghost: {
    padding: "8px 12px",
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
    background: "transparent",
    color: colors.textSoft,
    fontWeight: 600,
    cursor: "pointer",
  },

  icon: {
    minWidth: "40px",
    height: "40px",
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
    background: colors.secondary,
    color: "white",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1rem",
  },

  launch: {
    width: "76px",
    height: "76px",
    borderRadius: radius.pill,
    border: `2px solid ${colors.success}`,
    background: colors.success,
    color: "white",
    fontSize: "2rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: shadows.glowSuccess,
  },
};