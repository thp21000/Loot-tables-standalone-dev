import type { GameSystem, ItemSortMode, LootTable, TableSortMode } from "../types";
import { useMemo } from "react";
import TableEditor from "./TableEditor";
import { buttons, colors, controls, layout, radius, typography } from "../styles/ui";
import { useI18n } from "../i18n";
import { tCategory, tCurrency, tRarity, tType } from "../i18n/gameTerms";

type TableListProps = {
  tables: LootTable[];
  editingTableId: string | null;
  onEdit: (tableId: string) => void;
  onDelete: (tableId: string) => void;
  onRoll: (tableId: string) => void;
  onQuickRoll: (tableId: string) => void;
  onDuplicate: (tableId: string) => void;
  onSaveTable: (updatedTable: LootTable) => void;
  onCancelEdit: () => void;
  onShowAlert: (message: string) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  tableSortMode: TableSortMode;
  onTableSortModeChange: (value: TableSortMode) => void;
  expandedTableIds: string[];
  onExpandedTableIdsChange: (value: string[]) => void;
  itemSortModes: Record<string, ItemSortMode>;
  onItemSortModesChange: (value: Record<string, ItemSortMode>) => void;
  canManageTables: boolean;
  currentSystem: GameSystem;
};

const VIEW_ITEM_MIN_WIDTH = "648px";

const viewItemBlockStyle = {
  width: "fit-content",
  minWidth: VIEW_ITEM_MIN_WIDTH,
  margin: 0,
} as const;

const viewItemRowStyle = {
  width: "fit-content",
  minWidth: VIEW_ITEM_MIN_WIDTH,
  margin: 0,
} as const;

const viewItemNameCellStyle = {
  width: "100%",
  maxWidth: "420px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;

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

function getRarityRank(rarity: string): number {
  if (rarity === "Courant") return 1;
  if (rarity === "Aucun") return 1;
  if (rarity === "Peu courant") return 2;
  if (rarity === "Rare") return 3;
  if (rarity === "Très rare") return 4;
  if (rarity === "Légendaire") return 5;
  return 6;
}

function getValueInCopper(
  valueAmount: number,
  valueCurrency: "pc" | "pa" | "pe" | "po" | "pp"
): number {
  if (valueCurrency === "pc") return valueAmount;
  if (valueCurrency === "pa") return valueAmount * 10;
  if (valueCurrency === "pe") return valueAmount * 50;
  if (valueCurrency === "po") return valueAmount * 100;
  return valueAmount * 1000;
}

function sortTables(tables: LootTable[], mode: TableSortMode): LootTable[] {
  const sorted = [...tables];

  sorted.sort((a, b) => {
    if (mode === "updated-desc") {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }

    if (mode === "updated-asc") {
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }

    if (mode === "name-asc") {
      return a.name.localeCompare(b.name, "fr");
    }

    if (mode === "name-desc") {
      return b.name.localeCompare(a.name, "fr");
    }

    if (mode === "count-desc") {
      return b.items.length - a.items.length;
    }

    return a.items.length - b.items.length;
  });

  return sorted;
}

function sortItems(items: LootTable["items"], mode: ItemSortMode) {
  const sorted = [...items];

  sorted.sort((a, b) => {
    if (mode === "name-asc") {
      return a.name.localeCompare(b.name, "fr");
    }

    if (mode === "name-desc") {
      return b.name.localeCompare(a.name, "fr");
    }

    if (mode === "level-asc") {
      return a.level - b.level;
    }

    if (mode === "level-desc") {
      return b.level - a.level;
    }

    if (mode === "type-asc") {
      return (a.type || "").localeCompare(b.type || "", "fr");
    }

    if (mode === "type-desc") {
      return (b.type || "").localeCompare(a.type || "", "fr");
    }
    
    if (mode === "category-asc") {
      return a.category.localeCompare(b.category, "fr");
    }

    if (mode === "category-desc") {
      return b.category.localeCompare(a.category, "fr");
    }

    if (mode === "rarity-asc") {
      return getRarityRank(a.rarity) - getRarityRank(b.rarity);
    }

    if (mode === "rarity-desc") {
      return getRarityRank(b.rarity) - getRarityRank(a.rarity);
    }

    if (mode === "value-asc") {
      return (
        getValueInCopper(a.valueAmount, a.valueCurrency) -
        getValueInCopper(b.valueAmount, b.valueCurrency)
      );
    }

    return (
      getValueInCopper(b.valueAmount, b.valueCurrency) -
      getValueInCopper(a.valueAmount, a.valueCurrency)
    );
  });

  return sorted;
}

export default function TableList({
  tables,
  editingTableId,
  onEdit,
  onDelete,
  onRoll,
  onQuickRoll,
  onDuplicate,
  onSaveTable,
  onCancelEdit,
  onShowAlert,
  searchTerm,
  onSearchTermChange,
  tableSortMode,
  onTableSortModeChange,
  expandedTableIds,
  onExpandedTableIdsChange,
  itemSortModes,
  onItemSortModesChange,
  canManageTables,
  currentSystem,
}: TableListProps) {
  const { t, language: currentLanguage } = useI18n();
  const toAdaptiveWidth = (
    values: string[],
    minWidth: number,
    maxWidth: number,
    characterWidth = 8
  ) => {
    const longest = values.reduce((max, value) => Math.max(max, value.trim().length), 0);
    const computed = longest * characterWidth + 36;
    return `${Math.max(minWidth, Math.min(maxWidth, computed))}px`;
  };
  function toggleExpanded(tableId: string) {
    onExpandedTableIdsChange(
      expandedTableIds.includes(tableId)
        ? expandedTableIds.filter((id) => id !== tableId)
        : [...expandedTableIds, tableId]
    );
  }

  function getItemSortMode(tableId: string): ItemSortMode {
    return itemSortModes[tableId] ?? (currentSystem === "DND5E" ? "type-asc" : "level-asc");
  }

  function setItemSortMode(tableId: string, mode: ItemSortMode) {
    onItemSortModesChange({
      ...itemSortModes,
      [tableId]: mode,
    });
  }

  const filteredAndSortedTables = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered =
      normalizedSearch.length === 0
        ? tables
        : tables.filter((table) =>
            table.name.toLowerCase().includes(normalizedSearch)
          );

    return sortTables(filtered, tableSortMode);
  }, [tables, searchTerm, tableSortMode]);

  if (tables.length === 0) {
    return <p style={typography.pageSubtitle}>{t("table.none")}</p>;
  }

  return (
    <div style={{ marginTop: "16px", width: "fit-content", maxWidth: "100%" }}>
      <div
        style={{
          ...layout.toolbarCard,
          width: "100%",
          maxWidth: "100%",
        }}
      >
        <div style={{ width: "420px", maxWidth: "100%" }}>
          <label style={typography.label}>{t("table.search")}</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder={t("table.searchPlaceholder")}
            style={controls.input}
          />
        </div>

        <div style={{ width: "280px", maxWidth: "100%" }}>
          <label style={typography.label}>{t("table.sort")}</label>
          <select
            value={tableSortMode}
            onChange={(event) =>
              onTableSortModeChange(event.target.value as TableSortMode)
            }
            style={controls.select}
          >
            <option value="updated-desc">{t("table.sort.updatedDesc")}</option>
            <option value="updated-asc">{t("table.sort.updatedAsc")}</option>
            <option value="name-asc">{t("table.sort.nameAsc")}</option>
            <option value="name-desc">{t("table.sort.nameDesc")}</option>
            <option value="count-desc">{t("table.sort.countDesc")}</option>
            <option value="count-asc">{t("table.sort.countAsc")}</option>
          </select>
        </div>
      </div>

      {filteredAndSortedTables.length === 0 ? (
        <p style={typography.pageSubtitle}>{t("table.searchNoMatch")}</p>
      ) : (
        <div style={{ display: "grid", gap: "16px", width: "100%" }}>
          {filteredAndSortedTables.map((table) => {
            const isEditing = editingTableId === table.id;
            const isExpanded = expandedTableIds.includes(table.id);
            const sortedItems = sortItems(
              table.items,
              getItemSortMode(table.id)
            );
            const nameColumnWidth = toAdaptiveWidth(
              [t("column.name"), ...sortedItems.map((item) => item.name)],
              180,
              420
            );
            const categoryColumnWidth = toAdaptiveWidth(
              [
                t("column.category"),
                ...sortedItems.map((item) => tCategory(item.category, currentLanguage)),
              ],
              140,
              280
            );
            const viewItemGridTemplate =
              currentSystem === "DND5E"
                ? `minmax(${nameColumnWidth}, max-content) 72px minmax(${categoryColumnWidth}, max-content) 128px 118px 108px`
                : `minmax(${nameColumnWidth}, max-content) 72px 72px minmax(${categoryColumnWidth}, max-content) 86px 118px 118px 108px`;
            return (
              <div
                key={table.id}
                style={{
                  ...layout.card,
                  width: "100%",
                  maxWidth: "100%",
                }}
              >
                {!isEditing ? (
                  <div>
                    <div>
                      <h3 style={typography.cardTitle}>{table.name}</h3>

                      <p style={{ margin: "0 0 12px 0", textAlign: "center" }}>
                        <button
                          onClick={() => toggleExpanded(table.id)}
                          style={{
                            ...buttons.ghost,
                            border: "none",
                            padding: "0",
                            background: "transparent",
                            textDecoration: "underline",
                            color: colors.primary,
                          }}
                          title={
                            isExpanded
                            ? t("table.toggleItemsHide")
                            : t("table.toggleItemsShow")
                          }
                        >
                          {isExpanded ? "▼" : "▶"}{" "}
                          {t("table.itemCount", { count: table.items.length })}
                        </button>
                      </p>

                      {canManageTables ? (
                      <div
                        style={{
                          ...layout.centerRow,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                          <button
                            onClick={() => onEdit(table.id)}
                            aria-label={t("table.action.edit")}
                            style={buttons.secondary}
                          >
                            {t("table.action.edit")}
                          </button>
                          <button
                            onClick={() => onDelete(table.id)}
                            aria-label={t("table.action.delete")}
                            style={buttons.danger}
                          >
                            {t("table.action.delete")}
                          </button>
                          <button
                            onClick={() => onDuplicate(table.id)}
                            aria-label={t("table.action.duplicate")}
                            style={buttons.secondary}
                          >
                            {t("table.action.duplicate")}
                          </button>
                          <button
                            onClick={() => onQuickRoll(table.id)}
                            title={t("table.action.quickRollTitle")}
                            aria-label={t("table.action.quickRollTitle")}
                            style={{
                              ...buttons.icon,
                              width: "52px",
                              height: "52px",
                              borderRadius: "999px",
                              background: "#f59e0b",
                              border: "none",
                              fontSize: "1.25rem",
                            }}
                          >
                            ⚡
                          </button>
                          <button
                            onClick={() => onRoll(table.id)}
                            title={t("table.action.rollTitle")}
                            aria-label={t("table.action.rollTitle")}
                            style={buttons.launch}
                          >
                            ▶
                          </button>
                        </div>
                      ) : null}

                      {isExpanded && (
                        <div
                          style={{
                            marginTop: "16px",
                            borderTop: `1px solid ${colors.borderSoft}`,
                            paddingTop: "12px",
                            overflowX: "auto",
                          }}
                        >
                          {table.items.length === 0 ? (
                            <p
                              style={{
                                margin: 0,
                                color: colors.textMuted,
                                textAlign: "center",
                              }}
                            >
                              {t("table.emptyItems")}
                            </p>
                          ) : (
                            <div style={viewItemBlockStyle}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                  marginBottom: "10px",
                                  width: "100%",
                                }}
                              >
                                <div style={{ width: "220px" }}>
                                <label style={typography.label}>{t("table.sortItems")}</label>
                                  <select
                                    value={getItemSortMode(table.id)}
                                    onChange={(event) =>
                                      setItemSortMode(
                                        table.id,
                                        event.target.value as ItemSortMode
                                      )
                                    }
                                    style={controls.select}
                                  >
                                    {currentSystem === "PF2E" ? (
                                      <>
                                        <option value="level-asc">{t("table.itemSort.levelAsc")}</option>
                                        <option value="level-desc">{t("table.itemSort.levelDesc")}</option>
                                      </>
                                    ) : (
                                      <>
                                        <option value="type-asc">{t("table.itemSort.typeAsc")}</option>
                                        <option value="type-desc">{t("table.itemSort.typeDesc")}</option>
                                      </>
                                    )}
                                    <option value="name-asc">{t("table.itemSort.nameAsc")}</option>
                                    <option value="name-desc">{t("table.itemSort.nameDesc")}</option>
                                    <option value="category-asc">{t("table.itemSort.categoryAsc")}</option>
                                    <option value="category-desc">{t("table.itemSort.categoryDesc")}</option>
                                    <option value="rarity-asc">{t("table.itemSort.rarityAsc")}</option>
                                    <option value="rarity-desc">{t("table.itemSort.rarityDesc")}</option>
                                    <option value="value-asc">{t("table.itemSort.valueAsc")}</option>
                                    <option value="value-desc">{t("table.itemSort.valueDesc")}</option>
                                  </select>
                                </div>
                              </div>

                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: viewItemGridTemplate,
                                  gap: "8px",
                                  alignItems: "center",
                                  padding: "8px",
                                  marginBottom: "8px",
                                  fontWeight: "bold",
                                  color: colors.textSoft,
                                  textAlign: "left",
                                  ...viewItemRowStyle,
                                }}
                              >
                                <div>{t("column.name")}</div>
                                <div>{t("column.sheet")}</div>
                                {currentSystem === "PF2E" ? <div>{t("column.level")}</div> : null}
                                <div>{t("column.category")}</div>
                                {currentSystem === "PF2E" ? <div>{t("column.magic")}</div> : null}
                                {currentSystem === "DND5E" ? <div>{t("column.type")}</div> : null}
                                <div>{t("column.rarity")}</div>
                                <div>{t("column.amount")}</div>
                              </div>

                              <div style={{ display: "grid", gap: "8px" }}>
                                {sortedItems.map((item) => (
                                  <div
                                    key={item.id}
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns: viewItemGridTemplate,
                                      gap: "8px",
                                      alignItems: "center",
                                      padding: "10px",
                                      border: `1px solid ${colors.borderSoft}`,
                                      borderRadius: radius.md,
                                      background: colors.cardBgAlt,
                                      textAlign: "left",
                                      ...viewItemRowStyle,
                                    }}
                                  >
                                    <div style={viewItemNameCellStyle} title={item.name || t("common.unnamed")}>
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
                                    <div>{tCategory(item.category, currentLanguage)}</div>
                                    {currentSystem === "PF2E" ? <div>{item.magic ? t("common.yes") : t("common.no")}</div> : null}
                                    {currentSystem === "DND5E" ? (
                                      <div>{tType(item.type || "Aucun", currentLanguage)}</div>
                                    ) : null}
                                    <div
                                      style={{
                                        color: getRarityColor(item.rarity),
                                        fontWeight: 700,
                                      }}
                                    >
                                      {tRarity(item.rarity, currentLanguage)}
                                    </div>
                                    <div>
                                      {item.valueAmount} {tCurrency(item.valueCurrency, currentLanguage)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <TableEditor
                    table={table}
                    currentSystem={currentSystem}
                    onSave={onSaveTable}
                    onCancel={onCancelEdit}
                    onShowAlert={onShowAlert}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}