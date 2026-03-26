import { useEffect, useState } from "react";
import type {
  OwlbearPlayerRole,
  OwlbearRoomState,
} from "../types";
import {
  closeValidatedRollModal,
  getOwlbearPlayerRole,
  getRoomState,
  subscribeToRoomState,
  waitForOwlbearReady,
} from "../owlbear";
import { buttons, colors, layout, radius, typography } from "../styles/ui";
import { useI18n } from "../i18n";

function getRarityColor(rarity: string): string {
  if (rarity === "Courant") return "#9ca3af";
  if (rarity === "Peu courant") return "#f59e0b";
  if (rarity === "Rare") return "#60a5fa";
  return "#a78bfa";
}

function getRoleTitle(
  role: OwlbearPlayerRole,
  t: (key: string) => string
): string {
  return role === "GM" ? t("gain.shared") : t("gain.discovered");
}

function ItemName({
  name,
  url,
}: {
  name: string;
  url: string;
}) {
  if (!url.trim()) {
    return <div style={{ fontWeight: 700, fontSize: "1.06rem" }}>{name}</div>;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      style={{
        fontWeight: 700,
        fontSize: "1.06rem",
        color: colors.primary,
        textDecoration: "none",
      }}
    >
      {name}
    </a>
  );
}

export default function SharedGainPage() {
  const { t } = useI18n();
  const [playerRole, setPlayerRole] = useState<OwlbearPlayerRole>("UNKNOWN");
  const [roomState, setRoomState] = useState<OwlbearRoomState>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let isMounted = true;

    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");

    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyMargin = body.style.margin;
    const previousBodyHeight = body.style.height;
    const previousRootHeight = root?.style.height ?? "";
    const previousRootOverflow = root?.style.overflow ?? "";

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.margin = "0";
    body.style.height = "100vh";

    if (root) {
      root.style.height = "100vh";
      root.style.overflow = "hidden";
    }

    async function init() {
      try {
        await waitForOwlbearReady();

        const role = await getOwlbearPlayerRole();
        const state = await getRoomState();

        if (!isMounted) return;

        setPlayerRole(role);
        setRoomState(state);
        setIsLoading(false);

        unsubscribe = subscribeToRoomState((nextState) => {
          if (!isMounted) return;
          setRoomState(nextState);
        });
      } catch (error) {
        console.error("Impossible d'initialiser la page de gain :", error);
        if (!isMounted) return;
        setIsLoading(false);
      }
    }

    init();

    return () => {
      isMounted = false;

      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.margin = previousBodyMargin;
      body.style.height = previousBodyHeight;

      if (root) {
        root.style.height = previousRootHeight;
        root.style.overflow = previousRootOverflow;
      }

      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const summary = roomState.lastValidatedRoll ?? null;

  return (
    <div
      style={{
        height: "100vh",
        overflow: "hidden",
        padding: "16px",
        background: colors.pageBg,
        color: colors.text,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "760px",
          height: "100%",
          margin: "0 auto",
          border: `1px solid ${colors.border}`,
          borderRadius: radius.lg,
          background: colors.cardBg,
          padding: "18px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h1 style={{ ...typography.pageTitle, marginBottom: "16px" }}>
          {summary ? getRoleTitle(playerRole, t) : t("gain.title")}
        </h1>

        {isLoading ? (
          <div style={{ textAlign: "center" }}>
            <p style={typography.pageSubtitle}>{t("gain.loading")}</p>
          </div>
        ) : !summary ? (
          <div style={{ textAlign: "center" }}>
            <p style={typography.pageSubtitle}>{t("gain.empty")}</p>
            <button
              onClick={() => {
                void closeValidatedRollModal();
              }}
              style={buttons.primary}
            >
              {t("common.close")}
            </button>
          </div>
        ) : (
          <>
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
                {t("gain.noItem")}
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: "10px",
                  flex: "1 1 auto",
                  overflow: "hidden",
                }}
              >
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
                        justifyContent:
                          playerRole === "GM" ? "space-between" : "flex-start",
                        gap: "12px",
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <ItemName name={item.name} url={item.url} />

                      {playerRole === "GM" ? (
                        <div style={{ color: colors.textMuted }}>
                          {item.valueAmount} {item.valueCurrency}
                        </div>
                      ) : null}
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

            <div style={{ ...layout.centerRow, marginTop: "18px", flex: "0 0 auto" }}>
              <button
                onClick={() => {
                  void closeValidatedRollModal();
                }}
                style={buttons.primary}
              >
                {t("common.close")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}