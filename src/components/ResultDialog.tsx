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
  onOpenPresentation: () => void;
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
  onOpenPresentation,
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

  function renderExportCanvas(data: RollResult, displayOptions: ExportDisplayOptions): {
    canvas: HTMLCanvasElement;
    links: Array<{ x: number; y: number; width: number; height: number; url: string }>;
  } {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas non disponible");
    }

    const width = 1200;
    const headerHeight = 170;
    const rowHeight = displayOptions.showLink ? 118 : 96;
    const footerHeight = 80;
    const itemCount = Math.max(1, data.items.length);
    const height = Math.max(560, headerHeight + itemCount * rowHeight + footerHeight);
    const links: Array<{ x: number; y: number; width: number; height: number; url: string }> = [];

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
    context.fillText(t("gain.discovered"), width / 2, 108);

    context.textAlign = "left";

    if (data.items.length === 0) {
      context.font = "600 34px Georgia, serif";
      context.fillStyle = "#7c2d12";
      context.fillText(t("result.noItem"), 88, headerHeight + 80);
    } else {
      data.items.forEach((item, index) => {
        const cardY = headerHeight + index * rowHeight;
        context.fillStyle = "rgba(255, 248, 230, 0.58)";
        context.strokeStyle = "rgba(111, 79, 47, 0.45)";
        context.lineWidth = 2;
        context.beginPath();
        context.roundRect(54, cardY, width - 108, displayOptions.showLink ? 100 : 78, 14);
        context.fill();
        context.stroke();

        context.font = "700 34px Georgia, serif";
        context.fillStyle = displayOptions.showRarity ? getRarityColor(item.rarity) : "#3e2a16";
        context.fillText(item.name, 80, cardY + 35);

          if (displayOptions.showLink && item.url) {
          links.push({
            x: 66,
            y: cardY + 4,
            width: width - 132,
            height: displayOptions.showLink ? 96 : 72,
            url: item.url,
          });
        }

          context.font = "500 23px Georgia, serif";
        context.fillStyle = "#3e2a16";
        const details = [`${t("column.level")} ${item.level}`, tCategory(item.category, language)];

          if (displayOptions.showRarity) {
          details.push(tRarity(item.rarity, language));
        }

      if (displayOptions.showAmount) {
          details.push(`${item.valueAmount} ${tCurrency(item.valueCurrency, language)}`);
        }

        context.fillText(details.join(" • "), 80, cardY + 66);
      });
    }

    context.font = "500 20px Georgia, serif";
    context.fillStyle = "#6f4f2f";
    context.textAlign = "right";
    context.fillText(
      `${new Date(data.rolledAt).toLocaleString(language === "fr" ? "fr-FR" : "en-US")}`,
      width - 56,
      height - 32
    );

    return { canvas, links };
  }

  async function executeImageDownload() {
    if (!result) {
      return;
    }

    try {
      const { canvas } = renderExportCanvas(result, exportOptions);
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

  function escapePdfValue(value: string): string {
    return value
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");
  }

  function buildPdfFromCanvas(
    canvas: HTMLCanvasElement,
    links: Array<{ x: number; y: number; width: number; height: number; url: string }>
  ): Blob {
    const imageData = canvas.toDataURL("image/jpeg", 0.95);
    const base64 = imageData.split(",")[1] ?? "";
    const binaryString = atob(base64);
    const imageBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i += 1) {
      imageBytes[i] = binaryString.charCodeAt(i);
    }

    const encoder = new TextEncoder();
    const chunks: Uint8Array[] = [];
    let length = 0;
    const pushBytes = (bytes: Uint8Array) => {
      chunks.push(bytes);
      length += bytes.length;
    };
    const pushText = (text: string) => {
      pushBytes(encoder.encode(text));
    };

    const pageWidth = canvas.width;
    const pageHeight = canvas.height;
    const annotationCount = links.length;
    const imageObjectId = 5;
    const firstAnnotId = 6;
    const totalObjects = 5 + annotationCount;
    const annotsPart =
      annotationCount > 0
        ? `/Annots [${links.map((_, index) => `${firstAnnotId + index} 0 R`).join(" ")}]`
        : "";

      const offsets: number[] = [0];
    pushText("%PDF-1.4\n");

      const writeObject = (id: number, content: string) => {
      offsets[id] = length;
      pushText(`${id} 0 obj\n${content}\nendobj\n`);
    };

    writeObject(1, "<< /Type /Catalog /Pages 2 0 R >>");
    writeObject(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
    writeObject(
      3,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 ${imageObjectId} 0 R >> >> /Contents 4 0 R ${annotsPart} >>`
    );
    const contentStream = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ\n`;
    offsets[4] = length;
    pushText(`4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`);

    offsets[imageObjectId] = length;
    pushText(
      `${imageObjectId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`
    );
    pushBytes(imageBytes);
    pushText("\nendstream\nendobj\n");

    links.forEach((link, index) => {
      const id = firstAnnotId + index;
      const x1 = link.x;
      const y1 = pageHeight - (link.y + link.height);
      const x2 = link.x + link.width;
      const y2 = pageHeight - link.y;
      writeObject(
        id,
        `<< /Type /Annot /Subtype /Link /Rect [${x1} ${y1} ${x2} ${y2}] /Border [0 0 0] /A << /S /URI /URI (${escapePdfValue(link.url)}) >> >>`
      );
    });

    const xrefOffset = length;
    pushText(`xref\n0 ${totalObjects + 1}\n`);
    pushText("0000000000 65535 f \n");
    for (let id = 1; id <= totalObjects; id += 1) {
      pushText(`${String(offsets[id] ?? 0).padStart(10, "0")} 00000 n \n`);
    }
    pushText(`trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

    return new Blob(chunks as BlobPart[], { type: "application/pdf" });
  }

  function executePdfDownload() {
    if (!result) {
      return;
    }

    try {
      const { canvas, links } = renderExportCanvas(result, exportOptions);
      const filename = buildExportFilename("pdf");
      const pdfBlob = buildPdfFromCanvas(canvas, links);
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
              <button onClick={onOpenPresentation} style={buttons.secondary}>
              {t("result.openPresentation")}
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