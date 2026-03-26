import { useEffect, useState } from "react";
import type {
  GameSystem,
  LootCategory,
  LootCurrency,
  LootItem,
  LootRarity,
  LootTable,
} from "../types";
import { buttons, colors, controls, layout, radius, typography } from "../styles/ui";
import { useI18n } from "../i18n";
import { tCategory, tRarity, tType } from "../i18n/gameTerms";

type TableEditorProps = {
  table: LootTable;
  currentSystem: GameSystem;
  onSave: (updatedTable: LootTable) => void;
  onCancel: () => void;
  onShowAlert: (message: string) => void;
};

type EditableLootItem = LootItem & {
  isEditing: boolean;
  isNew?: boolean;
};
// Ces constantes restent dans la langue canonique des données.
// L’affichage est localisé via tCategory/tRarity/tType dans le rendu.

const PF2E_CATEGORY_OPTIONS: LootCategory[] = [
  "Arme",
  "Armure",
  "Consommable",
  "Contenant",
  "Equipement",
  "Trésor",
  "Autre",
];

const PF2E_RARITY_OPTIONS: LootRarity[] = [
  "Courant",
  "Peu courant",
  "Rare",
  "Unique",
];

const DND5E_CATEGORY_OPTIONS: LootCategory[] = [
  "Armes",
  "Armures",
  "Équipement d'aventurier",
  "Outils",
  "Montures et véhicules",
  "Marchandises",
  "Objets magiques",
  "Poisons",
  "Herbes",
];

const DND5E_TYPE_OPTIONS = [
  "Aucun",
  "Anneau",
  "Arme",
  "Armure",
  "Baguette",
  "Bâton",
  "Objets merveilleux",
  "Parchemin",
  "Potion",
  "Sceptre",
  "Plante",
  "Venin",
  "Toxine",
  "Mixture",
  "Altérant",
  "Antipoison",
  "Curatif",
  "Dopant",
  "Fortifiant",
] as const;

const DND5E_RARITY_OPTIONS: LootRarity[] = [
  "Aucun",
  "Commun (niv 1)",
  "Peu commun (niv 1)",
  "Rare",
  "Très rare (niv 11)",
  "Légendaire (niv 17)",
  "Artéfact",
];

const CURRENCY_OPTIONS: LootCurrency[] = ["pc", "pa", "pe", "po", "pp"];
const EDITOR_ITEM_GRID_TEMPLATE_PF2E =
  "minmax(220px, 300px) minmax(160px, 220px) 86px 130px 130px 160px auto";
const EDITOR_ITEM_GRID_TEMPLATE_DND5E =
  "minmax(220px, 300px) minmax(160px, 220px) 130px 130px 130px 160px auto";
const EDITOR_ITEM_MIN_WIDTH = "980px";

function createEmptyItem(): EditableLootItem {
  return {
    id: crypto.randomUUID(),
    name: "",
    url: "",
    level: 0,
    category: "Autre",
    type: "Aucun",
    rarity: "Courant",
    valueAmount: 0,
    valueCurrency: "pc",
    isEditing: true,
    isNew: true,
  };
}

function getRarityColor(rarity: LootRarity): string {
  if (rarity === "Courant") return "#9ca3af";
  if (rarity === "Peu courant") return "#f59e0b";
  if (rarity === "Rare") return "#60a5fa";
  return "#a78bfa";
}

function normalizePastedCategory(value: string): LootCategory {
  if (
    value === "Arme" ||
    value === "Armure" ||
    value === "Consommable" ||
    value === "Contenant" ||
    value === "Equipement" ||
    value === "Trésor"
  ) {
    return value;
  }
  return "Autre";
}

function normalizePastedRarity(value: string): LootRarity {
  if (
    value === "Courant" ||
    value === "Peu courant" ||
    value === "Rare" ||
    value === "Unique"
  ) {
    return value;
  }
  return "Courant";
}

function normalizePastedCurrency(value: string): LootCurrency {
  if (value === "pc" || value === "pa" || value === "po" || value === "pp") {
    return value;
  }
  return "pc";
}

function parsePastedRows(text: string): LootItem[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  return lines.map((line) => {
    const parts = line.split("\t");

    return {
      id: crypto.randomUUID(),
      name: (parts[0] ?? "").trim(),
      url: (parts[1] ?? "").trim(),
      level: Number(parts[2]) || 0,
      category: normalizePastedCategory((parts[3] ?? "").trim()),
      type: "Aucun",
      rarity: normalizePastedRarity((parts[4] ?? "").trim()),
      valueAmount: Number(parts[5]) || 0,
      valueCurrency: normalizePastedCurrency((parts[6] ?? "").trim()),
    };
  });
}

export default function TableEditor({
  table,
  currentSystem,
  onSave,
  onCancel,
  onShowAlert,
}: TableEditorProps) {
  const { t, language } = useI18n();
  const categoryOptions =
    currentSystem === "DND5E" ? DND5E_CATEGORY_OPTIONS : PF2E_CATEGORY_OPTIONS;
  const rarityOptions =
    currentSystem === "DND5E" ? DND5E_RARITY_OPTIONS : PF2E_RARITY_OPTIONS;
  const editorItemGridTemplate =
    currentSystem === "DND5E"
      ? EDITOR_ITEM_GRID_TEMPLATE_DND5E
      : EDITOR_ITEM_GRID_TEMPLATE_PF2E;
  const [name, setName] = useState(table.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [items, setItems] = useState<EditableLootItem[]>([]);
  const [pasteArea, setPasteArea] = useState("");
  const [isPasteAreaOpen, setIsPasteAreaOpen] = useState(false);

  useEffect(() => {
    setName(table.name);
    setIsEditingName(false);
    setPasteArea("");
    setIsPasteAreaOpen(false);
    setItems(
      table.items.map((item) => ({
        ...item,
        isEditing: false,
      }))
    );
  }, [table]);

  function handleAddItem() {
    setItems((prev) => [...prev, createEmptyItem()]);
  }

  function handleDeleteItem(itemId: string) {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }

  function handleDuplicateItem(itemId: string) {
    const item = items.find((entry) => entry.id === itemId);
    if (!item) return;

    const duplicated: EditableLootItem = {
      ...item,
      id: crypto.randomUUID(),
      name: `${item.name} (copie)`,
      isEditing: false,
      isNew: false,
    };

    setItems((prev) => [...prev, duplicated]);
  }

  function handleEditItem(itemId: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, isEditing: true } : item
      )
    );
  }

  function handleValidateItem(itemId: string) {
    const item = items.find((entry) => entry.id === itemId);

    if (!item) return;

    if (!item.name.trim()) {
      onShowAlert("Le nom de l’objet est obligatoire.");
      return;
    }

    if (item.level < 0 || Number.isNaN(item.level)) {
      onShowAlert(t("editor.error.levelNumber"));
      return;
    }

    if (item.valueAmount < 0 || Number.isNaN(item.valueAmount)) {
      onShowAlert(t("editor.error.valueNumber"));
      return;
    }

    setItems((prev) =>
      prev.map((entry) =>
        entry.id === itemId
          ? {
              ...entry,
              name: entry.name.trim(),
              url: entry.url.trim(),
              level: Number(entry.level) || 0,
              valueAmount: Number(entry.valueAmount) || 0,
              isEditing: false,
              isNew: false,
            }
          : entry
      )
    );
  }

  function handleItemChange<K extends keyof EditableLootItem>(
    itemId: string,
    field: K,
    value: EditableLootItem[K]
  ) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  }

  function handlePasteImport() {
    const importedItems = parsePastedRows(pasteArea).filter(
      (item) => item.name.trim() !== ""
    );

    if (importedItems.length === 0) {
      onShowAlert(t("editor.error.noPasteData"));
      return;
    }

    const importedEditableItems: EditableLootItem[] = importedItems.map(
      (item) => ({
        ...item,
        isEditing: false,
        isNew: false,
      })
    );

    setItems((prev) => [...prev, ...importedEditableItems]);
    setPasteArea("");
    setIsPasteAreaOpen(false);
    onShowAlert(t("editor.pasteImported", { count: importedEditableItems.length }));
  }

  function handleSaveTable() {
    const cleanedName = name.trim();

    if (!cleanedName) {
      onShowAlert("Le nom de la table est obligatoire.");
      return;
    }

    const hasEditingRow = items.some((item) => item.isEditing);
    if (hasEditingRow) {
      onShowAlert(
        "Il reste au moins une ligne d’objet en cours de modification. Valide ou supprime cette ligne avant d’enregistrer la table."
      );
      return;
    }

    const cleanedItems: LootItem[] = items.map((item) => ({
      id: item.id,
      name: item.name.trim(),
      url: item.url.trim(),
      level: Number(item.level) || 0,
      category: item.category,
      type: item.type || "Aucun",
      rarity: item.rarity,
      valueAmount: Number(item.valueAmount) || 0,
      valueCurrency: item.valueCurrency,
    }));

    const updatedTable: LootTable = {
      ...table,
      name: cleanedName,
      items: cleanedItems,
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedTable);
  }

  function handleScrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div style={{ width: "100%", overflow: "visible", paddingBottom: "112px" }}>
      <div style={{ marginBottom: "16px", textAlign: "center" }}>
        {!isEditingName ? (
          <div style={{ ...layout.centerRow }}>
            <h2 style={{ ...typography.cardTitle, margin: 0 }}>{name}</h2>
            <button
              onClick={() => setIsEditingName(true)}
              title={t("editor.alt.edit")}
              style={buttons.icon}
            >
              ✏️
            </button>
          </div>
        ) : (
          <div style={layout.centerRow}>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              style={{ ...controls.input, minWidth: "320px", maxWidth: "420px" }}
            />
            <button onClick={() => setIsEditingName(false)} style={buttons.primary}>
              ✅
            </button>
          </div>
        )}
      </div>

      <div style={{ ...layout.centerRow, marginBottom: "16px" }}>
        <button onClick={handleAddItem} style={buttons.primary}>
        {t("editor.addRow")}
        </button>
      </div>

      <div style={{ ...layout.sectionCard, marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            onClick={() => setIsPasteAreaOpen((prev) => !prev)}
            style={buttons.secondary}
          >
            {isPasteAreaOpen
              ? t("editor.pasteToggleHide")
              : t("editor.pasteToggleShow")}
          </button>
        </div>

        {isPasteAreaOpen && (
          <div style={{ marginTop: "12px" }}>
            <h3 style={typography.cardTitle}>{t("editor.pasteTitle")}</h3>
            <p style={{ ...typography.pageSubtitle, marginBottom: "12px" }}>
            {t("editor.pasteHelp")}
            </p>

            <textarea
              value={pasteArea}
              onChange={(event) => setPasteArea(event.target.value)}
              rows={6}
              style={controls.textarea}
            />

            <div style={{ marginTop: "10px", textAlign: "center" }}>
              <button onClick={handlePasteImport} style={buttons.primary}>
              {t("editor.pasteImport")}
              </button>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: editorItemGridTemplate,
          gap: "8px",
          alignItems: "center",
          padding: "10px",
          marginBottom: "8px",
          fontWeight: "bold",
          color: colors.textSoft,
          minWidth: EDITOR_ITEM_MIN_WIDTH,
          textAlign: "center",
        }}
      >
        <div>{t("column.name")}</div>
        <div>{t("column.sheet")}</div>
        {currentSystem === "PF2E" ? <div>{t("column.level")}</div> : null}
        <div>{t("column.category")}</div>
        {currentSystem === "DND5E" ? <div>{t("column.type")}</div> : null}
        <div>{t("column.rarity")}</div>
        <div>{t("column.amount")}</div>
        <div>{t("column.actions")}</div>
      </div>

      <div style={{ display: "grid", gap: "8px" }}>
        {items.map((item) => {
          if (item.isEditing) {
            return (
              <div
                key={item.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: editorItemGridTemplate,
                  gap: "8px",
                  alignItems: "center",
                  padding: "10px",
                  border: `1px solid ${colors.borderSoft}`,
                  borderRadius: radius.md,
                  background: colors.cardBgAlt,
                  minWidth: EDITOR_ITEM_MIN_WIDTH,
                }}
              >
                <input
                  placeholder={t("editor.placeholder.name")}
                  value={item.name}
                  onChange={(event) =>
                    handleItemChange(item.id, "name", event.target.value)
                  }
                  style={{ ...controls.input, textAlign: "center" }}
                />

                <input
                  placeholder={t("editor.placeholder.url")}
                  value={item.url}
                  onChange={(event) =>
                    handleItemChange(item.id, "url", event.target.value)
                  }
                  style={{ ...controls.input, textAlign: "center" }}
                />

                {currentSystem === "PF2E" ? (
                  <input
                    type="number"
                    min="0"
                    value={item.level}
                    onChange={(event) =>
                      handleItemChange(
                        item.id,
                        "level",
                        Number(event.target.value)
                      )
                    }
                    style={{ ...controls.input, textAlign: "center" }}
                  />
                ) : null}

                <select
                  value={item.category}
                  onChange={(event) =>
                    handleItemChange(
                      item.id,
                      "category",
                      event.target.value as LootCategory
                    )
                  }
                  style={{ ...controls.select, textAlign: "center" }}
                >
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {tCategory(option, language)}
                    </option>
                  ))}
                </select>

                {currentSystem === "DND5E" ? (
                  <select
                    value={item.type || "Aucun"}
                    onChange={(event) =>
                      handleItemChange(item.id, "type", event.target.value)
                    }
                    style={{ ...controls.select, textAlign: "center" }}
                  >
                    {DND5E_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {tType(option, language)}
                      </option>
                    ))}
                  </select>
                ) : null}

                <select
                  value={item.rarity}
                  onChange={(event) =>
                    handleItemChange(
                      item.id,
                      "rarity",
                      event.target.value as LootRarity
                    )
                  }
                  style={{ ...controls.select, textAlign: "center" }}
                >
                  {rarityOptions.map((option) => (
                    <option key={option} value={option}>
                      {tRarity(option, language)}
                    </option>
                  ))}
                </select>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 72px", gap: "6px" }}>
                  <input
                    type="number"
                    min="0"
                    value={item.valueAmount}
                    onChange={(event) =>
                      handleItemChange(
                        item.id,
                        "valueAmount",
                        Number(event.target.value)
                      )
                    }
                    style={{ ...controls.input, textAlign: "center" }}
                  />

                  <select
                    value={item.valueCurrency}
                    onChange={(event) =>
                      handleItemChange(
                        item.id,
                        "valueCurrency",
                        event.target.value as LootCurrency
                      )
                    }
                    style={{ ...controls.select, textAlign: "center" }}
                  >
                    {CURRENCY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={layout.centerRow}>
                  <button
                    title={t("common.save")}
                    aria-label={t("common.save")}
                    onClick={() => handleValidateItem(item.id)}
                    style={buttons.primary}
                  >
                    ✅
                  </button>
                  <button
                    title={t("editor.alt.delete")}
                    aria-label={t("editor.alt.delete")}
                    onClick={() => handleDeleteItem(item.id)}
                    style={buttons.danger}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={item.id}
              style={{
                display: "grid",
                gridTemplateColumns: editorItemGridTemplate,
                gap: "8px",
                alignItems: "center",
                padding: "10px",
                border: `1px solid ${colors.borderSoft}`,
                borderRadius: radius.md,
                background: colors.cardBgAlt,
                minWidth: EDITOR_ITEM_MIN_WIDTH,
                textAlign: "center",
              }}
            >
              <div>
                <strong>{item.name || t("common.unnamed")}</strong>
              </div>

              <div>
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: colors.primary }}
                  >
                    {t("column.sheet")}
                  </a>
                ) : (
                  "—"
                )}
              </div>

              {currentSystem === "PF2E" ? <div>{t("common.levelShort")} {item.level}</div> : null}
                <div>{tCategory(item.category, language)}</div>
              {currentSystem === "DND5E" ? <div>{tType(item.type || "Aucun", language)}</div> : null}
                <div style={{ color: getRarityColor(item.rarity), fontWeight: 700 }}>
                {tRarity(item.rarity, language)}
              </div>
              <div>{item.valueAmount} {item.valueCurrency}</div>

              <div style={layout.centerRow}>
                <button title={t("editor.alt.edit")} aria-label={t("editor.alt.edit")} onClick={() => handleEditItem(item.id)} style={buttons.icon}>
                  ✏️
                </button>
                <button title={t("editor.alt.duplicate")} aria-label={t("editor.alt.duplicate")} onClick={() => handleDuplicateItem(item.id)} style={buttons.icon}>
                  📄
                </button>
                <button title={t("editor.alt.delete")} aria-label={t("editor.alt.delete")} onClick={() => handleDeleteItem(item.id)} style={buttons.icon}>
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "fixed",
          right: "22px",
          bottom: "20px",
          zIndex: 1300,
          display: "flex",
          gap: "8px",
          alignItems: "center",
          padding: "10px",
          borderRadius: radius.lg,
          border: `1px solid ${colors.border}`,
          background: "rgba(17, 18, 20, 0.92)",
          boxShadow: "0 10px 28px rgba(0, 0, 0, 0.35)",
          backdropFilter: "blur(3px)",
        }}
      >
        <button onClick={handleSaveTable} style={buttons.primary}>
        {t("editor.saveTable")}
        </button>
        <button onClick={onCancel} style={buttons.secondary}>
        {t("editor.cancel")}
        </button>
        <button
          type="button"
          onClick={handleScrollToTop}
          style={{ ...buttons.icon, minWidth: "44px", height: "44px", fontSize: "1.15rem" }}
          title={t("editor.scrollTop")}
          aria-label={t("editor.scrollTop")}
        >
          ⬆️
        </button>
      </div>
    </div>
  );
}