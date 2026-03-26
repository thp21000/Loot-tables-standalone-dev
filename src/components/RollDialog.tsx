import { useEffect, useRef, useState } from "react";
import type { LootCategory, ProbabilityMode, RollOptions } from "../types";
import { buttons, controls, colors, typography } from "../styles/ui";
import { useI18n } from "../i18n";

type RollDialogProps = {
  isOpen: boolean;
  tableName: string;
  tableItems: Array<{ level: number; valueAmount: number; valueCurrency: "pc" | "pa" | "pe" | "po" | "pp" }>;
  availableCategories: LootCategory[];
  initialOptions: RollOptions;
  onClose: () => void;
  onConfirm: (options: RollOptions) => void;
  onShowAlert: (message: string) => void;
};

type DualSliderProps = {
  min: number;
  max: number;
  step?: number;
  minValue: number;
  maxValue: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
};

function DualSlider({
  min,
  max,
  step = 1,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
}: DualSliderProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState<"min" | "max" | null>(null);

  const safeRange = Math.max(max - min, 1);
  const minPercent = ((minValue - min) / safeRange) * 100;
  const maxPercent = ((maxValue - min) / safeRange) * 100;

  const clamp = (value: number, low: number, high: number) =>
    Math.min(Math.max(value, low), high);

  const clientXToValue = (clientX: number): number => {
    const track = trackRef.current;
    if (!track) return min;

    const rect = track.getBoundingClientRect();
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    const raw = min + ratio * safeRange;
    const stepped = Math.round(raw / step) * step;
    return clamp(stepped, min, max);
  };

  const updateFromClientX = (clientX: number, target: "min" | "max") => {
    const nextValue = clientXToValue(clientX);
    if (target === "min") {
      onMinChange(clamp(nextValue, min, maxValue));
      return;
    }
    onMaxChange(clamp(nextValue, minValue, max));
  };

  useEffect(() => {
    if (!dragging) return;

    const onMouseMove = (event: MouseEvent) => {
      updateFromClientX(event.clientX, dragging);
    };
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      updateFromClientX(touch.clientX, dragging);
    };
    const stopDragging = () => setDragging(null);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", stopDragging);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", stopDragging);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", stopDragging);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", stopDragging);
    };
  }, [dragging, minValue, maxValue, min, max, safeRange, step]);

  return (
    <div
      ref={trackRef}
      style={{
        position: "relative",
        height: "28px",
        width: "100%",
        minWidth: "240px",
        cursor: "pointer",
      }}
      onMouseDown={(event) => {
        const clickValue = clientXToValue(event.clientX);
        const distanceToMin = Math.abs(clickValue - minValue);
        const distanceToMax = Math.abs(clickValue - maxValue);
        const target = distanceToMin <= distanceToMax ? "min" : "max";
        updateFromClientX(event.clientX, target);
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          height: "8px",
          borderRadius: "999px",
          background: "#8b8fa3",
          opacity: 0.35,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          transform: "translateY(-50%)",
          height: "8px",
          borderRadius: "999px",
          background: "#6d5efc",
          left: `${minPercent}%`,
          width: `${Math.max(maxPercent - minPercent, 0)}%`,
        }}
      />
      <button
        type="button"
        style={{
          position: "absolute",
          top: "50%",
          left: `${minPercent}%`,
          transform: "translate(-50%, -50%)",
          width: "20px",
          height: "20px",
          borderRadius: "999px",
          border: "2px solid #e5e7eb",
          background: "#ffffff",
          cursor: "pointer",
          zIndex: 5,
          boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
          padding: 0,
          margin: 0,
          fontSize: 0,
          lineHeight: 0,
          color: "transparent",
        }}
        onMouseDown={(event) => {
          event.stopPropagation();
          setDragging("min");
        }}
        onTouchStart={(event) => {
          event.stopPropagation();
          setDragging("min");
        }}
        aria-label="min"
      />
      <button
        type="button"
        style={{
          position: "absolute",
          top: "50%",
          left: `${maxPercent}%`,
          transform: "translate(-50%, -50%)",
          width: "20px",
          height: "20px",
          borderRadius: "999px",
          border: "2px solid #e5e7eb",
          background: "#ffffff",
          cursor: "pointer",
          zIndex: 6,
          boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
          padding: 0,
          margin: 0,
          fontSize: 0,
          lineHeight: 0,
          color: "transparent",
        }}
        onMouseDown={(event) => {
          event.stopPropagation();
          setDragging("max");
        }}
        onTouchStart={(event) => {
          event.stopPropagation();
          setDragging("max");
        }}
        aria-label="max"
      />
    </div>
  );
}

export default function RollDialog({
  isOpen,
  tableName,
  tableItems,
  availableCategories,
  initialOptions,
  onClose,
  onConfirm,
  onShowAlert,
}: RollDialogProps) {
  const { t } = useI18n();
  const [minLevel, setMinLevel] = useState(0);
  const [maxLevel, setMaxLevel] = useState(1);
  const [minQuantity, setMinQuantity] = useState(1);
  const [maxQuantity, setMaxQuantity] = useState(1);
  const [minValuePc, setMinValuePc] = useState(0);
  const [maxValuePc, setMaxValuePc] = useState(1000000);
  const [selectedCategories, setSelectedCategories] = useState<LootCategory[]>(
    []
  );
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [probabilityMode, setProbabilityMode] =
    useState<ProbabilityMode>("balanced");
  
  const levelBounds = (() => {
    if (tableItems.length === 0) return { min: 0, max: 30 };
    const levels = tableItems.map((item) => item.level);
    return { min: Math.min(...levels), max: Math.max(...levels) };
  })();

  const valueToPc = (valueAmount: number, valueCurrency: "pc" | "pa" | "pe" | "po" | "pp") => {
    if (valueCurrency === "pc") return valueAmount;
    if (valueCurrency === "pa") return valueAmount * 10;
    if (valueCurrency === "pe") return valueAmount * 50;
    if (valueCurrency === "po") return valueAmount * 100;
    return valueAmount * 1000;
  };

  const valueBounds = (() => {
    if (tableItems.length === 0) return { min: 0, max: 1000 };
    const values = tableItems.map((item) => valueToPc(item.valueAmount, item.valueCurrency));
    return { min: Math.min(...values), max: Math.max(...values) };
  })();

  const quantityBounds = { min: 1, max: Math.max(1, tableItems.length) };

  useEffect(() => {
    if (!isOpen) return;

    setMinLevel(Math.max(levelBounds.min, Math.min(initialOptions.minLevel, levelBounds.max)));
    setMaxLevel(Math.max(levelBounds.min, Math.min(initialOptions.maxLevel, levelBounds.max)));
    setMinQuantity(Math.max(quantityBounds.min, Math.min(initialOptions.minQuantity, quantityBounds.max)));
    setMaxQuantity(Math.max(quantityBounds.min, Math.min(initialOptions.maxQuantity, quantityBounds.max)));
    setMinValuePc(Math.max(valueBounds.min, Math.min(initialOptions.minValuePc, valueBounds.max)));
    setMaxValuePc(Math.max(valueBounds.min, Math.min(initialOptions.maxValuePc, valueBounds.max)));
    setSelectedCategories(initialOptions.categories);
    setAllowDuplicates(initialOptions.allowDuplicates);
    setProbabilityMode(initialOptions.probabilityMode);
  }, [isOpen, initialOptions, levelBounds.min, levelBounds.max, valueBounds.min, valueBounds.max, quantityBounds.min, quantityBounds.max]);

  function toggleCategory(category: LootCategory) {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((entry) => entry !== category)
        : [...prev, category]
    );
  }

  function handleSubmit() {
    if (minLevel < 0 || maxLevel < 0 || minLevel > maxLevel) {
      onShowAlert(t("roll.maxLevelError"));
      return;
    }

    if (minQuantity <= 0 || maxQuantity <= 0 || minQuantity > maxQuantity) {
      onShowAlert(t("roll.quantityError"));
      return;
    }

    if (minValuePc < 0 || maxValuePc < 0 || minValuePc > maxValuePc) {
      onShowAlert(t("roll.valueError"));
      return;
    }

    onConfirm({
      minLevel,
      maxLevel,
      minQuantity,
      maxQuantity,
      minValuePc,
      maxValuePc,
      categories: selectedCategories,
      allowDuplicates,
      probabilityMode,
    });
  }

  if (!isOpen) {
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
          maxWidth: "640px",
          background: colors.cardBg,
          border: `1px solid ${colors.border}`,
          borderRadius: "16px",
          padding: "22px",
        }}
      >
        <h2 style={typography.cardTitle}>{t("roll.title")}</h2>

        <p style={{ ...typography.pageSubtitle, marginBottom: "18px" }}>
          {tableName}
        </p>

        <div style={{ display: "grid", gap: "16px" }}>
          <div>
          <label style={typography.label}>{t("roll.levelRange")}</label>
            <div style={{ display: "grid", gap: "8px" }}>
            <DualSlider
                min={levelBounds.min}
                max={levelBounds.max}
                minValue={minLevel}
                maxValue={maxLevel}
                onMinChange={(value) => setMinLevel(Math.min(value, maxLevel))}
                onMaxChange={(value) => setMaxLevel(Math.max(value, minLevel))}
              />
              <div
                style={{
                  ...typography.pageSubtitle,
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <span>{t("roll.min")}</span>
                <input
                  type="number"
                  min={levelBounds.min}
                  max={maxLevel}
                  value={minLevel}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (Number.isNaN(next)) return;
                    setMinLevel(Math.max(levelBounds.min, Math.min(next, maxLevel)));
                  }}
                  style={{ ...controls.input, width: "90px", padding: "6px 8px" }}
                />
                <span>{t("roll.max")}</span>
                <input
                  type="number"
                  min={minLevel}
                  max={levelBounds.max}
                  value={maxLevel}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (Number.isNaN(next)) return;
                    setMaxLevel(Math.min(levelBounds.max, Math.max(next, minLevel)));
                  }}
                  style={{ ...controls.input, width: "90px", padding: "6px 8px" }}
                />
                <span>{t("column.level")}</span>
              </div>
            </div>
          </div>

          <div>
          <label style={typography.label}>{t("roll.quantityRange")}</label>
            <div style={{ display: "grid", gap: "8px" }}>
            <DualSlider
                min={quantityBounds.min}
                max={quantityBounds.max}
                minValue={minQuantity}
                maxValue={maxQuantity}
                onMinChange={(value) => setMinQuantity(Math.min(value, maxQuantity))}
                onMaxChange={(value) => setMaxQuantity(Math.max(value, minQuantity))}
              />
               <div
                style={{
                  ...typography.pageSubtitle,
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <span>{t("roll.min")}</span>
                <input
                  type="number"
                  min={quantityBounds.min}
                  max={maxQuantity}
                  value={minQuantity}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (Number.isNaN(next)) return;
                    setMinQuantity(Math.max(quantityBounds.min, Math.min(next, maxQuantity)));
                  }}
                  style={{ ...controls.input, width: "90px", padding: "6px 8px" }}
                />
                <span>{t("roll.max")}</span>
                <input
                  type="number"
                  min={minQuantity}
                  max={quantityBounds.max}
                  value={maxQuantity}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (Number.isNaN(next)) return;
                    setMaxQuantity(Math.min(quantityBounds.max, Math.max(next, minQuantity)));
                  }}
                  style={{ ...controls.input, width: "90px", padding: "6px 8px" }}
                />
                <span>{t("roll.quantity")}</span>
              </div>
            </div>
          </div>

          <div>
            <label style={typography.label}>{t("roll.valueRangePc")}</label>
            <div style={{ display: "grid", gap: "8px" }}>
            <DualSlider
                min={valueBounds.min}
                max={valueBounds.max}
                step={10}
                minValue={minValuePc}
                maxValue={maxValuePc}
                onMinChange={(value) => setMinValuePc(Math.min(value, maxValuePc))}
                onMaxChange={(value) => setMaxValuePc(Math.max(value, minValuePc))}
              />
              <div
                style={{
                  ...typography.pageSubtitle,
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <span>{t("roll.min")}</span>
                <input
                  type="number"
                  min={valueBounds.min}
                  max={maxValuePc}
                  step={10}
                  value={minValuePc}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (Number.isNaN(next)) return;
                    setMinValuePc(Math.max(valueBounds.min, Math.min(next, maxValuePc)));
                  }}
                  style={{ ...controls.input, width: "110px", padding: "6px 8px" }}
                />
                <span>pc</span>
                <span>{t("roll.max")}</span>
                <input
                  type="number"
                  min={minValuePc}
                  max={valueBounds.max}
                  step={10}
                  value={maxValuePc}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (Number.isNaN(next)) return;
                    setMaxValuePc(Math.min(valueBounds.max, Math.max(next, minValuePc)));
                  }}
                  style={{ ...controls.input, width: "110px", padding: "6px 8px" }}
                />
                <span>pc</span>
              </div>
            </div>
          </div>

          <div>
          <label style={typography.label}>{t("roll.mode")}</label>
            <select
              value={probabilityMode}
              onChange={(event) =>
                setProbabilityMode(event.target.value as ProbabilityMode)
              }
              style={controls.select}
            >
              <option value="balanced">{t("roll.mode.balanced")}</option>
              <option value="low-soft">{t("roll.mode.lowSoft")}</option>
              <option value="low-strong">{t("roll.mode.lowStrong")}</option>
              <option value="high-soft">{t("roll.mode.highSoft")}</option>
              <option value="high-strong">{t("roll.mode.highStrong")}</option>
              <option value="rarity-only">{t("roll.mode.rarityOnly")}</option>
            </select>
          </div>

          <div>
          <label style={typography.label}>{t("roll.categories")}</label>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {availableCategories.map((category) => {
                const isSelected = selectedCategories.includes(category);

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    style={{
                      ...buttons.secondary,
                      background: isSelected ? colors.primary : colors.secondary,
                    }}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            <p
              style={{
                ...typography.pageSubtitle,
                textAlign: "left",
                marginTop: "8px",
                marginBottom: 0,
              }}
            >
              {t("roll.noCategoryHint")}
            </p>
          </div>

          <div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: colors.textSoft,
                fontWeight: 600,
              }}
            >
              <input
                type="checkbox"
                checked={allowDuplicates}
                onChange={(event) => setAllowDuplicates(event.target.checked)}
              />
              {t("roll.allowDuplicates")}
            </label>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            justifyContent: "center",
            marginTop: "24px",
            flexWrap: "wrap",
          }}
        >
          <button onClick={handleSubmit} style={buttons.primary}>
          {t("roll.submit")}
          </button>
          <button onClick={onClose} style={buttons.secondary}>
          {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}