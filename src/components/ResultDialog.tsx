import { useMemo, useState } from "react";
import type { GameSystem, OwlbearPlayerRole, ProbabilityMode, RollResult } from "../types";
import { buttons, colors, layout, radius, typography } from "../styles/ui";
import { useI18n } from "../i18n";
import { tCategory, tCurrency, tRarity } from "../i18n/gameTerms";

type ResultDialogProps = {
  isOpen: boolean;
  result: RollResult | null;
  history: RollResult[];
  onClose: () => void;
  onReroll: () => void;
  onValidate: () => void;
  onShowAlert: (message: string) => void;
  playerRole: OwlbearPlayerRole;
};

function getRarityColor(rarity: string): string {
  if (rarity === "Aucun") return "#9ca3af";
  if (rarity === "Courant") return "#9ca3af";
  if (rarity === "Peu courant") return "#f59e0b";
  if (rarity === "Rare") return "#60a5fa";
  if (rarity === "Très rare") return "#2c68b1";
  if (rarity === "Légendaire") return "#00ff00";
  if (rarity === "Unique") return "#a78bfa";
  if (rarity === "Artéfact") return "#a78bfa";
  return "#a78bfa";
}

function getModeLabel(mode: ProbabilityMode, system: GameSystem, t: (key: string) => string): string {
  if (mode === "balanced") return t("roll.mode.balanced");
  if (mode === "low-soft") return system === "DND5E" ? t("roll.mode.lowSoftDnd") : t("roll.mode.lowSoft");
  if (mode === "low-strong") return system === "DND5E" ? t("roll.mode.lowStrongDnd") : t("roll.mode.lowStrong");
  if (mode === "high-soft") return system === "DND5E" ? t("roll.mode.highSoftDnd") : t("roll.mode.highSoft");
  if (mode === "high-strong") return system === "DND5E" ? t("roll.mode.highStrongDnd") : t("roll.mode.highStrong");
  return t("roll.mode.rarityOnly");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "loot-result";
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function formatResultText(
  result: RollResult,
  t: (key: string, params?: Record<string, string | number>) => string,
  language: "fr" | "en"
): string {
  const header = `${t("result.title.gm")} — ${result.tableName}`;
  const options = `${t("result.optionsSummary", {
    minLevel: result.options.minLevel,
    maxLevel: result.options.maxLevel,
    minQuantity: result.options.minQuantity,
    maxQuantity: result.options.maxQuantity,
    minValuePc: result.options.minValuePc,
    maxValuePc: result.options.maxValuePc,
    allowDuplicates: result.options.allowDuplicates
      ? t("result.allowDuplicates.yes")
      : t("result.allowDuplicates.no"),
    allowMagic: result.options.allowMagic ? t("common.yes") : t("common.no"),
  })} | ${t("result.modeSummary", {
    mode: getModeLabel(result.options.probabilityMode, result.system, (key) => t(key)),
  })}`;
  const categories =
    result.options.categories.length > 0
    ? `${t("roll.categories")} : ${result.options.categories
      .map((category) => tCategory(category, language))
      .join(", ")}`
  : `${t("roll.categories")} : *`;

  const items =
    result.items.length === 0
    ? [t("result.noItem")]
      : result.items.map(
        (item, index) =>
         `${index + 1}. ${item.name} — ${t("result.level", { level: item.level })} — ${tCategory(item.category, language)} — ${tRarity(item.rarity, language)} — ${item.valueAmount} ${tCurrency(item.valueCurrency, language)}${item.url ? ` — ${item.url}` : ""}`
      );

  return [header, options, categories, "", ...items].join("\n");
}

export default function ResultDialog({
  isOpen,
  result,
  history,
  onClose,
  onReroll,
  onValidate,
  onShowAlert,
  playerRole,
}: ResultDialogProps) {
  const { t, language } = useI18n();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const textToCopy = useMemo(() => {
    if (!result) return "";
    return formatResultText(result, t, language);
  }, [result, t, language]);

  async function handleCopy() {
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      onShowAlert(t("result.copyOk"));
    } catch (error) {
      console.error(error);
      onShowAlert(t("result.copyError"));
    }
  }

  async function handleDownloadImage() {
    if (!result || !textToCopy) {
      return;
    }

    try {
      const lines = textToCopy.split("\n");
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Canvas non disponible");
      }

      const font = "18px Inter, Arial, sans-serif";
      context.font = font;

      const maxLineWidth = lines.reduce((acc, line) => Math.max(acc, context.measureText(line).width), 0);
      const padding = 36;
      const lineHeight = 28;

      canvas.width = Math.ceil(Math.max(760, maxLineWidth + padding * 2));
      canvas.height = Math.ceil(Math.max(420, lines.length * lineHeight + padding * 2));

      context.fillStyle = "#0b0f17";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.font = font;
      context.fillStyle = "#f3f4f6";

      lines.forEach((line, index) => {
        context.fillText(line || " ", padding, padding + (index + 1) * lineHeight);
      });

      const filename = `${slugify(result.tableName)}-${new Date().toISOString().slice(0, 10)}.png`;

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((nextBlob) => {
          if (!nextBlob) {
            reject(new Error("Image invalide"));
            return;
          }

          resolve(nextBlob);
        }, "image/png");
      });

      downloadBlob(blob, filename);
      onShowAlert(t("result.downloadImageOk"));
    } catch (error) {
      console.error(error);
      onShowAlert(t("result.downloadImageError"));
    }
  }

  function escapePdfText(value: string): string {
    return value
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");
  }

  function buildPdfBlob(text: string): Blob {
    const lines = text.split("\n");
    const linesPerPage = 42;
    const pageChunks: string[][] = [];

    for (let index = 0; index < lines.length; index += linesPerPage) {
      pageChunks.push(lines.slice(index, index + linesPerPage));
    }

    const objects: string[] = [];

    const addObject = (content: string): number => {
      objects.push(content);
      return objects.length;
    };

    const fontObjectId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

    const pageObjectIds: number[] = [];

    pageChunks.forEach((chunk) => {
      const body = [
        "BT",
        "/F1 11 Tf",
        "48 792 Td",
        "14 TL",
        ...chunk.map((line) => `(${escapePdfText(line || " ")}) Tj T*`),
        "ET",
      ].join("\n");

      const contentObjectId = addObject(
        `<< /Length ${body.length} >>\nstream\n${body}\nendstream`
      );

      const pageObjectId = addObject(
        `<< /Type /Page /Parent {{PAGES_ID}} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`
      );

      pageObjectIds.push(pageObjectId);
    });

    const pagesObjectId = addObject(
      `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`
    );

    const catalogObjectId = addObject(`<< /Type /Catalog /Pages ${pagesObjectId} 0 R >>`);

    const normalizedObjects = objects.map((object) =>
      object.replace(/\{\{PAGES_ID\}\}/g, String(pagesObjectId))
    );

    let pdf = "%PDF-1.4\n";
    const offsets: number[] = [0];

    normalizedObjects.forEach((object, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });

    const xrefOffset = pdf.length;

    pdf += `xref\n0 ${normalizedObjects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";
    offsets.slice(1).forEach((offset) => {
      pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    });

    pdf += `trailer\n<< /Size ${normalizedObjects.length + 1} /Root ${catalogObjectId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return new Blob([pdf], { type: "application/pdf" });
  }

  function handleDownloadPdf() {
    if (!result || !textToCopy) {
      return;
    }

    try {
      const filename = `${slugify(result.tableName)}-${new Date().toISOString().slice(0, 10)}.pdf`;
      const pdfBlob = buildPdfBlob(textToCopy);
      downloadBlob(pdfBlob, filename);
      onShowAlert(t("result.downloadPdfOk"));
    } catch (error) {
      console.error(error);
      onShowAlert(t("result.downloadPdfError"));
    }
  }

  if (!isOpen || !result) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        zIndex: 1000,
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "920px",
          maxHeight: "90vh",
          overflowY: "auto",
          background: colors.cardBg,
          border: `1px solid ${colors.border}`,
          borderRadius: "16px",
          padding: "22px",
        }}
      >
        <h2 style={typography.cardTitle}>
        {playerRole === "GM" ? t("result.title.gm") : t("result.title.player")}
        </h2>

        <p style={{ ...typography.pageSubtitle, marginBottom: "6px" }}>
          {result.tableName}
        </p>

        <p style={{ ...typography.pageSubtitle, marginBottom: "4px" }}>
        {t("result.optionsSummary", {
            minLevel: result.options.minLevel,
            maxLevel: result.options.maxLevel,
            minQuantity: result.options.minQuantity,
            maxQuantity: result.options.maxQuantity,
            minValuePc: result.options.minValuePc,
            maxValuePc: result.options.maxValuePc,
            allowDuplicates: result.options.allowDuplicates
              ? t("result.allowDuplicates.yes")
              : t("result.allowDuplicates.no"),
            allowMagic: result.options.allowMagic ? t("common.yes") : t("common.no"),
          })}
        </p>

        <p style={{ ...typography.pageSubtitle, marginBottom: "18px" }}>
        {t("result.modeSummary", {
            mode: getModeLabel(result.options.probabilityMode, result.system, t),
          })}
        </p>

        {result.items.length === 0 ? (
          <p style={{ textAlign: "center", marginTop: "24px", color: colors.textSoft }}>
            {t("result.noItem")}
          </p>
        ) : (
          <div style={{ display: "grid", gap: "12px", marginTop: "20px" }}>
            {result.items.map((item, index) => (
              <div
                key={`${item.id}-${index}-${item.effectiveWeight}`}
                style={{
                  border: `1px solid ${colors.borderSoft}`,
                  borderRadius: radius.md,
                  padding: "14px",
                  background: colors.cardBgAlt,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "16px",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong>{item.name}</strong>
                    {item.url ? (
                      <>
                        {" · "}
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: colors.primary }}
                        >
                          {t("column.sheet")}
                        </a>
                      </>
                    ) : null}
                  </div>

                  <div style={{ color: colors.textMuted }}>
                    {item.valueAmount} {tCurrency(item.valueCurrency, language)}
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
                  <span>{t("result.level", { level: item.level })}</span>
                  <span>{tCategory(item.category, language)}</span>
                  <span
                    style={{
                      color: getRarityColor(item.rarity),
                      fontWeight: 700,
                    }}
                  >
                    {tRarity(item.rarity, language)}
                  </span>
                  <span>
                    {t("result.weight", {
                      weight: Math.round(item.effectiveWeight * 100) / 100,
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            ...layout.centerRow,
            marginTop: "24px",
          }}
        >
          {playerRole === "GM" ? (
            <>
              <button onClick={onValidate} style={buttons.primary}>
              {t("result.validate")}
              </button>
              <button onClick={onReroll} style={buttons.secondary}>
              {t("result.reroll")}
              </button>
            </>
          ) : null}

          <button onClick={handleCopy} style={buttons.secondary}>
          {t("result.copy")}
          </button>
          <button onClick={handleDownloadImage} style={buttons.secondary}>
          {t("result.downloadImage")}
          </button>
          <button onClick={handleDownloadPdf} style={buttons.secondary}>
          {t("result.downloadPdf")}
          </button>
          <button onClick={onClose} style={buttons.secondary}>
          {t("common.close")}
          </button>
        </div>

        <div style={{ marginTop: "28px" }}>
          <button
            onClick={() => setIsHistoryOpen((prev) => !prev)}
            style={buttons.secondary}
          >
            {isHistoryOpen
              ? t("result.history.hide")
              : t("result.history.show")}
          </button>

          {isHistoryOpen && (
            <>
              {history.length === 0 ? (
                <p style={{ color: colors.textMuted, marginTop: "12px" }}>
                  {t("result.history.empty")}
                </p>
              ) : (
                <div style={{ display: "grid", gap: "10px", marginTop: "12px" }}>
                  {history.map((entry, index) => (
                    <div
                      key={`${entry.rolledAt}-${index}`}
                      style={{
                        border: `1px solid ${colors.borderSoft}`,
                        borderRadius: radius.md,
                        padding: "12px",
                        background: colors.panelBg,
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{entry.tableName}</div>
                      <div
                        style={{
                          color: colors.textMuted,
                          fontSize: "0.9rem",
                          marginTop: "4px",
                        }}
                      >
                        {t("result.history.summary", {
                          minLevel: entry.options.minLevel,
                          maxLevel: entry.options.maxLevel,
                          minQuantity: entry.options.minQuantity,
                          maxQuantity: entry.options.maxQuantity,
                          minValuePc: entry.options.minValuePc,
                          maxValuePc: entry.options.maxValuePc,
                          mode: getModeLabel(entry.options.probabilityMode, entry.system, t),
                        })}
                      </div>
                      <div style={{ marginTop: "6px", color: colors.textSoft }}>
                        {entry.items.length === 0
                          ? t("result.history.noItem")
                          : entry.items.map((item) => item.name).join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}