import { useMemo, useState } from "react";
import type { GameSystem, OwlbearPlayerRole, ProbabilityMode, RollResult } from "../types";
import { buttons, colors, layout, radius, typography } from "../styles/ui";
import { useI18n } from "../i18n";
import { tCategory, tCurrency, tRarity } from "../i18n/gameTerms";
import Modal from "./Modal";

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

type ExportDisplayOptions = {
  showRarity: boolean;
  showAmount: boolean;
  showLink: boolean;
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

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildExportFilename(extension: "png" | "pdf"): string {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const timePart = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  return `Loot-Tables-${datePart}-${timePart}.${extension}`;
}

function formatResultText(
  result: RollResult,
  t: (key: string, params?: Record<string, string | number>) => string,
  language: "fr" | "en",
  displayOptions: ExportDisplayOptions
): string {
  const header = t("gain.discovered");

  const items =
    result.items.length === 0
    ? [t("result.noItem")]
      : result.items.map(
        (item, index) => {
          const details = [
            t("result.level", { level: item.level }),
            tCategory(item.category, language),
          ];

          if (displayOptions.showRarity) {
            details.push(tRarity(item.rarity, language));
          }

          if (displayOptions.showAmount) {
            details.push(`${item.valueAmount} ${tCurrency(item.valueCurrency, language)}`);
          }

          if (displayOptions.showLink && item.url) {
            details.push(item.url);
          }

          return `${index + 1}. ${item.name} — ${details.join(" — ")}`;
        }
      );

  return [header, "", ...items].join("\n");
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
  const [pendingExportAction, setPendingExportAction] = useState<"copy" | "image" | "pdf" | null>(null);
  const [exportOptions, setExportOptions] = useState<ExportDisplayOptions>({
    showRarity: true,
    showAmount: true,
    showLink: false,
  });

  const textToCopy = useMemo(() => {
    if (!result) return "";
    return formatResultText(result, t, language, exportOptions);
  }, [result, t, language, exportOptions]);

  function openExportOptions(action: "copy" | "image" | "pdf") {
    setPendingExportAction(action);
  }

  function closeExportOptions() {
    setPendingExportAction(null);
  }

  async function executeCopy() {
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      onShowAlert(t("result.copyOk"));
    } catch (error) {
      console.error(error);
      onShowAlert(t("result.copyError"));
    }
  }

  async function executeImageDownload() {
    if (!result || !textToCopy) {
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Canvas non disponible");
      }

      const width = 1200;
      const headerHeight = 170;
      const rowHeight = exportOptions.showLink ? 118 : 96;
      const footerHeight = 80;
      const itemCount = Math.max(1, result.items.length);
      const height = Math.max(560, headerHeight + itemCount * rowHeight + footerHeight);

      canvas.width = width;
      canvas.height = height;

      const parchmentGradient = context.createLinearGradient(0, 0, width, height);
      parchmentGradient.addColorStop(0, "#f4e7cb");
      parchmentGradient.addColorStop(0.45, "#ead7b0");
      parchmentGradient.addColorStop(1, "#dcc394");

      context.fillStyle = parchmentGradient;
      context.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < 2800; i += 1) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const alpha = 0.02 + Math.random() * 0.04;
        context.fillStyle = `rgba(86, 63, 39, ${alpha})`;
        context.fillRect(x, y, 2, 2);
      }

      context.strokeStyle = "#6f4f2f";
      context.lineWidth = 10;
      context.strokeRect(16, 16, width - 32, height - 32);

      context.fillStyle = "#3e2a16";
      context.font = "700 56px Georgia, serif";
      context.textAlign = "center";
      context.fillText(t("gain.discovered"), width / 2, 92);

      context.textAlign = "left";

      if (result.items.length === 0) {
        context.font = "600 34px Georgia, serif";
        context.fillStyle = "#7c2d12";
        context.fillText(t("result.noItem"), 88, headerHeight + 80);
      } else {
        result.items.forEach((item, index) => {
          const cardY = headerHeight + index * rowHeight;
          context.fillStyle = "rgba(255, 248, 230, 0.58)";
          context.strokeStyle = "rgba(111, 79, 47, 0.45)";
          context.lineWidth = 2;
          context.beginPath();
          context.roundRect(54, cardY, width - 108, exportOptions.showLink ? 100 : 78, 14);
          context.fill();
          context.stroke();

          context.font = "700 34px Georgia, serif";
          context.fillStyle = exportOptions.showRarity ? getRarityColor(item.rarity) : "#3e2a16";
          context.fillText(item.name, 80, cardY + 35);

          context.font = "500 23px Georgia, serif";
          context.fillStyle = "#3e2a16";
          const details = [
            `${t("column.level")} ${item.level}`,
            tCategory(item.category, language),
          ];

          if (exportOptions.showRarity) {
            details.push(tRarity(item.rarity, language));
          }

          if (exportOptions.showAmount) {
            details.push(`${item.valueAmount} ${tCurrency(item.valueCurrency, language)}`);
          }

          context.fillText(details.join(" • "), 80, cardY + 66);

          if (exportOptions.showLink && item.url) {
            context.font = "500 18px Georgia, serif";
            context.fillStyle = "#355f9a";
            context.fillText(item.url, 80, cardY + 88);
          }
        });
      }

      context.font = "500 20px Georgia, serif";
      context.fillStyle = "#6f4f2f";
      context.textAlign = "right";
      context.fillText(
        `${new Date(result.rolledAt).toLocaleString(language === "fr" ? "fr-FR" : "en-US")}`,
        width - 56,
        height - 32
      );

      const filename = buildExportFilename("png");

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

  function buildPdfBlob(data: RollResult, displayOptions: ExportDisplayOptions): Blob {
    const pageWidth = 595;
    const pageHeight = 842;
    const margin = 48;
    const rowHeight = displayOptions.showLink ? 58 : 42;
    const rowsPerPage = 11;
    const chunks: typeof data.items[] = [];

    for (let index = 0; index < data.items.length; index += rowsPerPage) {
      chunks.push(data.items.slice(index, index + rowsPerPage));
    }

    if (chunks.length === 0) {
      chunks.push([]);
    }

    const objects: string[] = [];
    const addObject = (content: string): number => {
      objects.push(content);
      return objects.length;
    };

    const fontObjectId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    const pageObjectIds: number[] = [];

    chunks.forEach((chunk) => {
      const commands: string[] = [
        "0.96 0.91 0.80 rg",
        "0 0 595 842 re f",
        "0.44 0.31 0.18 RG",
        "6 w",
        "18 18 559 806 re S",
        "0.24 0.16 0.09 rg",
        "BT /F1 28 Tf 200 790 Td (" + escapePdfText(t("gain.discovered")) + ") Tj ET",
      ];

      if (chunk.length === 0) {
        commands.push(
          "0.49 0.18 0.07 rg",
          "BT /F1 16 Tf 80 740 Td (" + escapePdfText(t("result.noItem")) + ") Tj ET"
        );
      }

      const pageAnnotationIds: number[] = [];

      chunk.forEach((item, itemIndex) => {
        const yTop = 730 - itemIndex * rowHeight;
        const details = [`${t("column.level")} ${item.level}`, tCategory(item.category, language)];

        if (displayOptions.showRarity) {
          details.push(tRarity(item.rarity, language));
        }

        if (displayOptions.showAmount) {
          details.push(`${item.valueAmount} ${tCurrency(item.valueCurrency, language)}`);
        }

        commands.push(
          "0.15 0.11 0.06 rg",
          `BT /F1 15 Tf ${margin} ${yTop} Td (${escapePdfText(item.name)}) Tj ET`,
          "0.24 0.16 0.09 rg",
          `BT /F1 11 Tf ${margin} ${yTop - 16} Td (${escapePdfText(details.join(" • "))}) Tj ET`
        );

        if (displayOptions.showLink && item.url) {
          const estimatedNameWidth = Math.min(420, Math.max(80, item.name.length * 7.2));
          const annotObjectId = addObject(
            `<< /Type /Annot /Subtype /Link /Rect [${margin} ${yTop - 2} ${margin + estimatedNameWidth} ${yTop + 16}] /Border [0 0 0] /A << /S /URI /URI (${escapePdfText(item.url)}) >> >>`
          );
          pageAnnotationIds.push(annotObjectId);

          commands.push(
            "0.21 0.37 0.60 rg",
            `BT /F1 10 Tf ${margin} ${yTop - 30} Td (${escapePdfText(item.url)}) Tj ET`
          );
        }
      });

      const contentStream = commands.join("\n");
      const contentObjectId = addObject(
        `<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`
      );

      const annotsPart =
        pageAnnotationIds.length > 0
          ? `/Annots [${pageAnnotationIds.map((id) => `${id} 0 R`).join(" ")}]`
          : "";

      const pageObjectId = addObject(
        `<< /Type /Page /Parent {{PAGES_ID}} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R ${annotsPart} >>`
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

  function executePdfDownload() {
    if (!result) {
      return;
    }

    try {
      const filename = buildExportFilename("pdf");
      const pdfBlob = buildPdfBlob(result, exportOptions);
      downloadBlob(pdfBlob, filename);
      onShowAlert(t("result.downloadPdfOk"));
    } catch (error) {
      console.error(error);
      onShowAlert(t("result.downloadPdfError"));
    }
  }

  async function handleConfirmExportOptions() {
    if (pendingExportAction === "copy") {
      await executeCopy();
    }

    if (pendingExportAction === "image") {
      await executeImageDownload();
    }

    if (pendingExportAction === "pdf") {
      executePdfDownload();
    }
    
    closeExportOptions();
  }

  if (!isOpen || !result) {
    return null;
  }

  return (
    <>
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

          <button onClick={() => openExportOptions("copy")} style={buttons.secondary}>
          {t("result.copy")}
          </button>
          <button onClick={() => openExportOptions("image")} style={buttons.secondary}>
          {t("result.downloadImage")}
          </button>
          <button onClick={() => openExportOptions("pdf")} style={buttons.secondary}>
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
    <Modal
      isOpen={pendingExportAction !== null}
      title={t("result.exportOptions.title")}
      onClose={closeExportOptions}
      footer={(
        <>
          <button type="button" onClick={closeExportOptions} style={buttons.secondary}>
            {t("common.cancel")}
          </button>
          <button type="button" onClick={() => void handleConfirmExportOptions()} style={buttons.primary}>
            {t("result.exportOptions.confirm")}
          </button>
        </>
      )}
    >
      <div style={{ display: "grid", gap: "12px", color: colors.text }}>
        <p style={{ margin: 0, color: colors.textSoft }}>
          {t("result.exportOptions.description")}
        </p>

        <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <input
            type="checkbox"
            checked={exportOptions.showRarity}
            onChange={(event) =>
              setExportOptions((prev) => ({ ...prev, showRarity: event.target.checked }))
            }
          />
          <span>{t("column.rarity")}</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <input
            type="checkbox"
            checked={exportOptions.showAmount}
            onChange={(event) =>
              setExportOptions((prev) => ({ ...prev, showAmount: event.target.checked }))
            }
          />
          <span>{t("column.amount")}</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <input
            type="checkbox"
            checked={exportOptions.showLink}
            onChange={(event) =>
              setExportOptions((prev) => ({ ...prev, showLink: event.target.checked }))
            }
          />
          <span>{t("column.sheet")}</span>
        </label>
      </div>
    </Modal>
    </>
  );
}