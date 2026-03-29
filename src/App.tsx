import { useEffect, useRef, useState } from "react";
import type {
  ImportItemsResult,
  ImportMode,
  ItemSortMode,
  GameSystem,
  LootItem,
  LootTable,
  OwlbearPlayerRole,
  OwlbearRoomState,
  RollOptions,
  RollResult,
  TableSortMode,
  ValidatedRollSummary,
} from "./types";
import {
  duplicateTable,
  exportSingleTableToCsv,
  exportSingleTableToJson,
  exportTablesToJson,
  importItemsFromCsvFile,
  importSingleTableFromCsv,
  importTablesFromFile,
  loadTables,
  loadUIState,
  mergeImportedTables,
  saveTables,
  saveUIState,
} from "./utils/storage";
import TableList from "./components/TableList";
import RollDialog from "./components/RollDialog";
import ResultDialog from "./components/ResultDialog";
import ConfirmModal from "./components/ConfirmModal";
import AlertModal from "./components/AlertModal";
import Modal from "./components/Modal";
import { getAvailableCategories, rollLootTable } from "./utils/loot";
import { buttons, colors, controls, layout, typography } from "./styles/ui";
import flagFr from "./assets/flag-fr.svg";
import flagGb from "./assets/flag-gb.svg";
import {
  getOwlbearPlayerName,
  getOwlbearPlayerRole,
  getRoomState,
  notifyInfo,
  notifySuccess,
  openValidatedRollModal,
  publishValidatedRoll,
  setRoomState,
  subscribeToRoomState,
  subscribeToValidatedRolls,
} from "./owlbear";
import { useI18n } from "./i18n";

function getItemSignature(item: Omit<LootItem, "id"> | LootItem): string {
  return [
    item.name.trim().toLowerCase(),
    item.level,
    item.category,
    item.magic ? "1" : "0",
    item.rarity,
    item.valueAmount,
    item.valueCurrency,
    item.url.trim().toLowerCase(),
  ].join("||");
}

function mergeItemsWithDuplicateFilter(
  existingItems: LootItem[],
  importedItems: LootItem[],
  mode: ImportMode
): ImportItemsResult & { nextItems: LootItem[] } {
  if (mode === "replace") {
    const seen = new Set<string>();
    const dedupedImported: LootItem[] = [];

    for (const item of importedItems) {
      const signature = getItemSignature(item);

      if (seen.has(signature)) {
        continue;
      }

      seen.add(signature);
      dedupedImported.push(item);
    }

    return {
      nextItems: dedupedImported,
      importedCount: dedupedImported.length,
      skippedDuplicatesCount: importedItems.length - dedupedImported.length,
      replaced: true,
    };
  }

  const seen = new Set(existingItems.map((item) => getItemSignature(item)));
  const appended: LootItem[] = [];
  let skippedDuplicatesCount = 0;

  for (const item of importedItems) {
    const signature = getItemSignature(item);

    if (seen.has(signature)) {
      skippedDuplicatesCount += 1;
      continue;
    }

    seen.add(signature);
    appended.push(item);
  }

  return {
    nextItems: [...existingItems, ...appended],
    importedCount: appended.length,
    skippedDuplicatesCount,
    replaced: false,
  };
}

function buildValidatedSummary(
  result: RollResult,
  validatedBy?: string | null
): ValidatedRollSummary {
  return {
    tableId: result.tableId,
    tableName: result.tableName,
    validatedAt: new Date().toISOString(),
    validatedBy: validatedBy ?? null,
    items: result.items.map((item) => ({
      name: item.name,
      url: item.url,
      level: item.level,
      category: item.category,
      magic: item.magic,
      type: item.type,
      rarity: item.rarity,
      valueAmount: item.valueAmount,
      valueCurrency: item.valueCurrency,
    })),
  };
}

function formatValidatedRollMessage(
  summary: ValidatedRollSummary,
  roleText: string
): string {
  const prefix = summary.validatedBy
  ? `${summary.validatedBy} ${roleText}`
  : roleText;

  if (summary.items.length === 0) {
    return `${prefix} : aucun objet trouvé.`;
  }

  const itemList = summary.items.map((item) => item.name).join(", ");

  return `${prefix} : ${itemList}`;
}

function getRoleLabel(
  role: OwlbearPlayerRole,
  t: (key: string) => string
): string {
  if (role === "GM") return t("app.role.gm");
  if (role === "PLAYER") return t("app.role.player");
  return t("app.role.unknown");
}

type TransferAction = "import" | "export";
type TransferScope = "global" | "table" | "new-table";
type TransferFormat = "json" | "csv";
const NEWS_SEEN_SESSION_KEY = "loot-tables-news-seen-v1";

export default function App() {
  const { language, setLanguage, t } = useI18n();
  const initialUIState = loadUIState();
  const [currentSystem, setCurrentSystem] = useState<GameSystem>(initialUIState.currentSystem);

  const [tables, setTables] = useState<LootTable[]>(() => loadTables(initialUIState.currentSystem));
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [rollingTableId, setRollingTableId] = useState<string | null>(null);
  const [lastRollTableId, setLastRollTableId] = useState<string | null>(null);
  const [lastRollOptions, setLastRollOptions] = useState<RollOptions>(
    initialUIState.lastRollOptions
  );
  const [rollResult, setRollResult] = useState<RollResult | null>(null);
  const [rollHistory, setRollHistory] = useState<RollResult[]>([]);
  const [tableIdToDelete, setTableIdToDelete] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState(initialUIState.searchTerm);
  const [tableSortMode, setTableSortMode] = useState<TableSortMode>(
    initialUIState.tableSortMode
  );
  const [expandedTableIds, setExpandedTableIds] = useState<string[]>(
    initialUIState.expandedTableIds
  );
  const [itemSortModes, setItemSortModes] = useState<Record<string, ItemSortMode>>(
    initialUIState.itemSortModes
  );

  const [playerRole, setPlayerRole] = useState<OwlbearPlayerRole>("UNKNOWN");
  const [roomState, setLocalRoomState] = useState<OwlbearRoomState>({});

  const transferFileInputRef = useRef<HTMLInputElement | null>(null);
  const lastSystemForSaveRef = useRef<GameSystem>(initialUIState.currentSystem);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferAction, setTransferAction] = useState<TransferAction>("import");
  const [transferScope, setTransferScope] = useState<TransferScope>("global");
  const [transferFormat, setTransferFormat] = useState<TransferFormat>("json");
  const [transferTableId, setTransferTableId] = useState<string>("");
  const [transferImportMode, setTransferImportMode] = useState<ImportMode>("append");
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);

  useEffect(() => {
    const hasSystemChanged = lastSystemForSaveRef.current !== currentSystem;
    if (tables.length === 0) {
      if (hasSystemChanged) {
        lastSystemForSaveRef.current = currentSystem;
        return;
      }
      saveTables([], currentSystem);
      lastSystemForSaveRef.current = currentSystem;
      return;
    }
    const targetSystem = tables[0].system;

    if (!tables.every((table) => table.system === targetSystem)) {
      return;
    }

    saveTables(tables, targetSystem);
    lastSystemForSaveRef.current = currentSystem;
  }, [tables, currentSystem]);

  useEffect(() => {
    setTables(loadTables(currentSystem));
    setEditingTableId(null);
    setExpandedTableIds([]);
    setItemSortModes({});
  }, [currentSystem]);

  useEffect(() => {
    saveUIState({
      searchTerm,
      currentSystem,
      tableSortMode,
      expandedTableIds,
      itemSortModes,
      lastRollOptions,
    });
  }, [currentSystem, searchTerm, tableSortMode, expandedTableIds, itemSortModes, lastRollOptions]);

  useEffect(() => {
    if (tables.length === 0) {
      setTransferTableId("");
      return;
    }

    if (!transferTableId || !tables.some((table) => table.id === transferTableId)) {
      setTransferTableId(tables[0].id);
    }
  }, [tables, transferTableId]);

  useEffect(() => {
    const hasSeenNews = sessionStorage.getItem(NEWS_SEEN_SESSION_KEY) === "1";
    if (!hasSeenNews) {
      setIsNewsModalOpen(true);
      sessionStorage.setItem(NEWS_SEEN_SESSION_KEY, "1");
    }
  }, []);

  useEffect(() => {
    let unsubscribeRoom: (() => void) | null = null;
    let unsubscribeBroadcast: (() => void) | null = null;

    async function initOwlbearContext() {
      const role = await getOwlbearPlayerRole();
      const currentRoomState = await getRoomState();

      setPlayerRole(role);
      setLocalRoomState(currentRoomState);

      await setRoomState({
        lastOpenedAt: new Date().toISOString(),
      });

      unsubscribeRoom = subscribeToRoomState((nextState) => {
        setLocalRoomState(nextState);
      });

      unsubscribeBroadcast = subscribeToValidatedRolls((summary) => {
        void notifyInfo(formatValidatedRollMessage(summary, "a validé un tirage"));
        void openValidatedRollModal(summary);
      });
    }

    initOwlbearContext().catch((error) => {
      console.error("Initialisation du contexte Owlbear impossible :", error);
    });

    return () => {
      if (unsubscribeRoom) {
        unsubscribeRoom();
      }
      if (unsubscribeBroadcast) {
        unsubscribeBroadcast();
      }
    };
  }, []);

  function handleCreateTable() {
    const now = new Date().toISOString();

    const newTable: LootTable = {
      id: crypto.randomUUID(),
      name: `${t("app.newTablePrefix")} ${tables.length + 1}`,
      system: currentSystem,
      items: [],
      createdAt: now,
      updatedAt: now,
    };

    setTables((prev) => [...prev, newTable]);
    setEditingTableId(newTable.id);
  }

  function handleDeleteTable(tableId: string) {
    setTableIdToDelete(tableId);
  }

  function confirmDeleteTable() {
    if (!tableIdToDelete) {
      return;
    }

    const tableId = tableIdToDelete;

    setTables((prev) => prev.filter((table) => table.id !== tableId));

    if (editingTableId === tableId) {
      setEditingTableId(null);
    }

    if (rollingTableId === tableId) {
      setRollingTableId(null);
    }

    if (lastRollTableId === tableId) {
      setLastRollTableId(null);
      setRollResult(null);
    }

    setExpandedTableIds((prev) => prev.filter((id) => id !== tableId));

    setItemSortModes((prev) => {
      const next = { ...prev };
      delete next[tableId];
      return next;
    });

    setTableIdToDelete(null);
  }

  function cancelDeleteTable() {
    setTableIdToDelete(null);
  }

  function handleEditTable(tableId: string) {
    setEditingTableId(tableId);
  }

  function handleRollTable(tableId: string) {
    if (playerRole !== "GM") {
      setAlertMessage(t("app.onlyGmRoll"));
      return;
    }
    setRollingTableId(tableId);
  }

  async function persistLastRollTableId(tableId: string) {
    try {
      await setRoomState({ lastRollTableId: tableId });
    } catch (error) {
      console.error("Impossible de sauvegarder lastRollTableId dans Owlbear :", error);
    }
  }

  function pushHistory(result: RollResult) {
    setRollHistory((prev) => [result, ...prev].slice(0, 10));
  }

  function handleQuickRollTable(tableId: string) {
    if (playerRole !== "GM") {
      setAlertMessage(t("app.onlyGmRoll"));
      return;
    }

    const table = tables.find((entry) => entry.id === tableId);

    if (!table) {
      return;
    }

    const result = rollLootTable(table, lastRollOptions);

    setLastRollTableId(table.id);
    void persistLastRollTableId(table.id);
    setRollResult(result);
    pushHistory(result);
  }

  function handleDuplicateTable(tableId: string) {
    const table = tables.find((entry) => entry.id === tableId);
    if (!table) return;

    const duplicated = duplicateTable(table);
    setTables((prev) => [...prev, duplicated]);
    setAlertMessage(t("app.tableDuplicated", { name: duplicated.name }));
  }

  function handleExportSingleTableJson(tableId: string) {
    const table = tables.find((entry) => entry.id === tableId);
    if (!table) return;

    exportSingleTableToJson(table);
    setAlertMessage(t("app.exportJsonReady", { name: table.name }));
  }

  function handleExportSingleTableCsv(tableId: string) {
    const table = tables.find((entry) => entry.id === tableId);
    if (!table) return;

    exportSingleTableToCsv(table);
    setAlertMessage(t("app.exportCsvReady", { name: table.name }));
  }

  function handleSaveEditedTable(updatedTable: LootTable) {
    setTables((prev) =>
      prev.map((table) => (table.id === updatedTable.id ? updatedTable : table))
    );
    setEditingTableId(null);
    setAlertMessage(t("app.tableSaved", { name: updatedTable.name }));
  }

  function handleCancelEdit() {
    setEditingTableId(null);
  }

  async function handleImportCsvIntoTable(
    tableId: string,
    file: File,
    mode: ImportMode
  ) {
    try {
      const importedItemsForSystem = await importItemsFromCsvFile(file, currentSystem);

      const tableToUpdate = tables.find((table) => table.id === tableId);

      if (!tableToUpdate) {
        setAlertMessage(t("app.csvImportTableNotFound"));
        return;
      }

      const merged = mergeItemsWithDuplicateFilter(
        tableToUpdate.items,
        importedItemsForSystem,
        mode
      );

      setTables((prev) =>
        prev.map((table) =>
          table.id === tableId
            ? {
                ...table,
                items: merged.nextItems,
                updatedAt: new Date().toISOString(),
              }
            : table
        )
      );

      const baseMessage = merged.replaced
      ? t("app.importDoneReplace", { count: merged.importedCount })
      : t("app.importDoneAppend", { count: merged.importedCount });

      const duplicateMessage =
        merged.skippedDuplicatesCount > 0
        ? ` ${t("app.importDuplicatesSkipped", {
          count: merged.skippedDuplicatesCount,
        })}`
          : "";

      setAlertMessage(baseMessage + duplicateMessage);
    } catch (error) {
      console.error(error);
      setAlertMessage(t("app.importCsvFailed"));
    }
  }

  function handleCloseRollDialog() {
    setRollingTableId(null);
  }

  function handleConfirmRoll(options: RollOptions) {
    const table = tables.find((entry) => entry.id === rollingTableId);

    if (!table) {
      return;
    }

    const result = rollLootTable(table, options);

    setLastRollTableId(table.id);
    void persistLastRollTableId(table.id);
    setLastRollOptions(options);
    setRollResult(result);
    pushHistory(result);
    setRollingTableId(null);
  }

  async function handleValidateRoll() {
    if (playerRole !== "GM") {
      setAlertMessage(t("app.onlyGmValidate"));
      return;
    }

    if (!rollResult) {
      return;
    }

    const validatedBy = await getOwlbearPlayerName();
    const summary = buildValidatedSummary(rollResult, validatedBy);

    await publishValidatedRoll(summary);
    await notifySuccess(formatValidatedRollMessage(summary, "a validé un tirage"));
    setAlertMessage(t("app.rollShared"));
  }

  function handleCloseResultDialog() {
    setRollResult(null);
  }

  function handleReroll() {
    if (!lastRollTableId) {
      return;
    }

    const table = tables.find((entry) => entry.id === lastRollTableId);

    if (!table) {
      return;
    }

    const result = rollLootTable(table, lastRollOptions);
    setRollResult(result);
    pushHistory(result);
  }

  function handleExportTables() {
    exportTablesToJson(tables);
    setAlertMessage(t("app.globalExportDone"));
  }

  function getAvailableTransferFormats(
    action: TransferAction,
    scope: TransferScope
  ): TransferFormat[] {
    if (action === "export" && scope === "global") {
      return ["json"];
    }

    if (action === "import" && scope === "table") {
      return ["csv"];
    }

    if (action === "import" && scope === "new-table") {
      return ["json", "csv"];
    }

    if (action === "export" && scope === "table") {
      return ["json", "csv"];
    }

    return ["json", "csv"];
  }

  function normalizeTransferFormat(
    action: TransferAction,
    scope: TransferScope,
    format: TransferFormat
  ): TransferFormat {
    const available = getAvailableTransferFormats(action, scope);
    return available.includes(format) ? format : available[0];
  }

  function openTransferModal() {
    setTransferAction("import");
    setTransferScope("global");
    setTransferFormat("json");
    setTransferTableId((prev) => (prev ? prev : tables[0]?.id ?? ""));
    setTransferImportMode("append");
    setIsTransferModalOpen(true);
  }

  function closeTransferModal() {
    setIsTransferModalOpen(false);
  }

  function handleTransferActionChange(action: TransferAction) {
    const nextScope =
      action === "export" && transferScope === "new-table"
        ? "global"
        : transferScope;

    setTransferAction(action);
    setTransferScope(nextScope);
    setTransferFormat((prev) => normalizeTransferFormat(action, nextScope, prev));
  }

  function handleTransferScopeChange(scope: TransferScope) {
    setTransferScope(scope);
    setTransferFormat((prev) => normalizeTransferFormat(transferAction, scope, prev));
  }

  async function handleTransferFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      if (transferFormat === "json" && transferScope === "global") {
        const importedTables = await importTablesFromFile(file);
        const importedTablesForSystem = importedTables.map((table) => ({
          ...table,
          system: currentSystem,
          items: table.items.map((item) => ({
            ...item,
            type: item.type ?? "Aucun",
          })),
        }));
        const mergedTables = mergeImportedTables(tables, importedTablesForSystem);
        setTables(mergedTables);
        setAlertMessage(t("app.importTablesSuccess", { count: importedTables.length }));
      } else if (transferFormat === "json" && transferScope === "new-table") {
        const importedTables = await importTablesFromFile(file);
        const firstImportedTable = importedTables[0];

        if (!firstImportedTable) {
          setAlertMessage(t("app.importNoTableInJson"));
          return;
        }

        const now = new Date().toISOString();
        const newTable: LootTable = {
          ...firstImportedTable,
          system: currentSystem,
          id: crypto.randomUUID(),
          items: firstImportedTable.items.map((item) => ({
            ...item,
            type: item.type ?? "Aucun",
          })),
          createdAt: now,
          updatedAt: now,
        };

        setTables((prev) => [...prev, newTable]);
        setAlertMessage(t("app.importNewTableFromJson", { name: newTable.name }));
      } else if (transferFormat === "csv" && transferScope === "global") {
        const importedTable = await importSingleTableFromCsv(file, undefined, currentSystem);
        setTables((prev) => [...prev, importedTable]);
        setAlertMessage(t("app.importCsvTable", { name: importedTable.name }));
      } else if (transferFormat === "csv" && transferScope === "new-table") {
        const importedTable = await importSingleTableFromCsv(file, undefined, currentSystem);
        setTables((prev) => [...prev, importedTable]);
        setAlertMessage(t("app.importNewTableFromCsv", { name: importedTable.name }));
      } else if (transferFormat === "csv" && transferScope === "table") {
        if (!transferTableId) {
          setAlertMessage(t("app.targetTableRequiredImport"));
          return;
        }

        await handleImportCsvIntoTable(transferTableId, file, transferImportMode);
      } else {
        setAlertMessage(t("app.transfer.unavailable"));
      }
    } catch (error) {
      console.error(error);
      setAlertMessage(t("app.invalidImportedFile"));
    } finally {
      event.target.value = "";
      setIsTransferModalOpen(false);
    }
  }

  function handleExecuteTransfer() {
    if (transferAction === "export") {
      if (transferScope === "global" && transferFormat === "json") {
        handleExportTables();
        setIsTransferModalOpen(false);
        return;
      }

      if (!transferTableId) {
        setAlertMessage(t("app.targetTableRequiredExport"));
        return;
      }

      if (transferFormat === "json") {
        handleExportSingleTableJson(transferTableId);
      } else {
        handleExportSingleTableCsv(transferTableId);
      }

      setIsTransferModalOpen(false);
      return;
    }

    const input = transferFileInputRef.current;

    if (!input) {
      setAlertMessage(t("app.transfer.openFilePickerError"));
      return;
    }

    input.accept =
      transferFormat === "json" ? ".json,application/json" : ".csv,text/csv";
    input.click();
  }

  function openSettingsModal() {
    setIsSettingsModalOpen(true);
  }

  function closeSettingsModal() {
    setIsSettingsModalOpen(false);
  }

  function openNewsModal() {
    setIsNewsModalOpen(true);
    sessionStorage.setItem(NEWS_SEEN_SESSION_KEY, "1");
  }

  function closeNewsModal() {
    setIsNewsModalOpen(false);
  }

  function switchLanguageFromNews(nextLanguage: "fr" | "en") {
    setLanguage(nextLanguage);
  }

  const rollingTable =
    rollingTableId === null
      ? null
      : tables.find((table) => table.id === rollingTableId) ?? null;

  const canManageTables = playerRole === "GM";

  return (
    <div
      style={{
        ...layout.page,
        width: "100%",
        maxWidth: "100%",
        minHeight: "100vh",
        padding: "16px 18px 10px",
        boxSizing: "border-box",
        background: colors.pageBg,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1280px",
          margin: "0 auto",
          paddingBottom: "8px",
          boxSizing: "border-box",
          background: colors.pageBg,
        }}
      >
      <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "8px",
            }}
          >
            <button
              type="button"
              onClick={openSettingsModal}
              style={{
                ...buttons.icon,
                width: "44px",
                height: "44px",
                fontSize: "1.2rem",
              }}
              title={t("app.settings.title")}
              aria-label={t("app.settings.title")}
            >
              ⚙️
            </button>
          </div>

          <h1 style={{ ...typography.pageTitle, marginBottom: "4px" }}>{t("app.title")}</h1>

          <p style={{ ...typography.pageSubtitle, marginBottom: "14px" }}>
          {t("app.subtitle")} ({tables.length})
          </p>

          {canManageTables ? (
            <div style={{ ...layout.topBar, marginBottom: "14px" }}>
              <button onClick={handleCreateTable} style={buttons.primary}>
              {t("app.createTable")}
              </button>
              <button onClick={openTransferModal} style={buttons.secondary}>
              {t("app.transfer")}
              </button>
            </div>
          ) : null}

          <input
            ref={transferFileInputRef}
            type="file"
            onChange={handleTransferFileChange}
            style={{ display: "none" }}
          />

<div style={{ width: "100%", maxWidth: "100%" }}>
            <TableList
              key={`table-list-${language}-${currentSystem}`}
              tables={tables}
              editingTableId={editingTableId}
              onEdit={handleEditTable}
              onDelete={handleDeleteTable}
              onRoll={handleRollTable}
              onQuickRoll={handleQuickRollTable}
              onDuplicate={handleDuplicateTable}
              onSaveTable={handleSaveEditedTable}
              onCancelEdit={handleCancelEdit}
              onShowAlert={(message) => setAlertMessage(message)}
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              tableSortMode={tableSortMode}
              onTableSortModeChange={setTableSortMode}
              expandedTableIds={expandedTableIds}
              onExpandedTableIdsChange={setExpandedTableIds}
              itemSortModes={itemSortModes}
              onItemSortModesChange={setItemSortModes}
              canManageTables={canManageTables}
              currentSystem={currentSystem}
            />

            <div
              style={{
                width: "100%",
                marginTop: "12px",
                paddingTop: "8px",
                borderTop: `1px solid ${colors.borderSoft}`,
                display: "grid",
                gap: "6px",
                color: colors.textMuted,
                fontSize: "0.82rem",
                lineHeight: 1.2,
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "flex-start",
                  gap: "6px 14px",
                }}
              >
                <span>Mode : {getRoleLabel(playerRole, t)}</span>
                <span>{t("app.mode.standalone")}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "flex-start",
                  gap: "6px 14px",
                }}
              >
                {roomState.lastOpenedAt ? (
                  <span>
                    {t("footer.lastOpened", {
                      date: new Date(roomState.lastOpenedAt).toLocaleString(),
                    })}
                  </span>
                ) : null}
                {roomState.lastValidatedRoll ? (
                  <span>
                  {t("footer.lastGain", {
                    tableName: roomState.lastValidatedRoll.tableName,
                  })}
                </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      
        <Modal
        isOpen={isSettingsModalOpen}
        title={t("app.settings.title")}
        onClose={closeSettingsModal}
        footer={
          <button type="button" onClick={closeSettingsModal} style={buttons.secondary}>
            {t("common.close")}
          </button>
        }
      >
        <div style={{ display: "grid", gap: "14px" }}>
          {canManageTables ? (
            <div>
              <p style={{ ...typography.label, marginBottom: "8px" }}>
                {t("app.settings.system")}
              </p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setCurrentSystem("PF2E")}
                  style={{
                    ...buttons.secondary,
                    width: "140px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    border:
                      currentSystem === "PF2E"
                        ? `2px solid ${colors.primary}`
                        : `1px solid ${colors.border}`,
                    background: currentSystem === "PF2E" ? colors.primary : colors.secondary,
                  }}
                >
                  <span style={{ fontSize: "1.2rem" }}>⚔️</span>
                  <span>{t("app.settings.system.pf2e")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentSystem("DND5E")}
                  style={{
                    ...buttons.secondary,
                    width: "140px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    border:
                      currentSystem === "DND5E"
                        ? `2px solid ${colors.primary}`
                        : `1px solid ${colors.border}`,
                    background: currentSystem === "DND5E" ? colors.primary : colors.secondary,
                  }}
                >
                  <span style={{ fontSize: "1.2rem" }}>🐉</span>
                  <span>{t("app.settings.system.dnd5e")}</span>
                </button>
              </div>
            </div>
          ) : null}

          <div>
            <p style={{ ...typography.label, marginBottom: "8px" }}>
              {t("app.settings.language")}
            </p>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setLanguage("fr")}
                style={{
                  ...buttons.secondary,
                  width: "140px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  border:
                    language === "fr"
                      ? `2px solid ${colors.primary}`
                      : `1px solid ${colors.border}`,
                  background: language === "fr" ? colors.primary : colors.secondary,
                }}
              >
                <img
                  src={flagFr}
                  alt={t("lang.fr")}
                  style={{ width: "22px", height: "16px", borderRadius: "2px" }}
                />
                <span>{t("lang.fr")}</span>
              </button>

              <button
                type="button"
                onClick={() => setLanguage("en")}
                style={{
                  ...buttons.secondary,
                  width: "140px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  border:
                    language === "en"
                      ? `2px solid ${colors.primary}`
                      : `1px solid ${colors.border}`,
                  background: language === "en" ? colors.primary : colors.secondary,
                }}
              >
                <img
                  src={flagGb}
                  alt={t("lang.en")}
                  style={{ width: "22px", height: "16px", borderRadius: "2px" }}
                />
                <span>{t("lang.en")}</span>
              </button>
              </div>
              </div>

              <div>
                <p style={{ ...typography.label, marginBottom: "8px" }}>
                  {t("app.settings.news")}
                </p>
                <button type="button" onClick={openNewsModal} style={buttons.secondary}>
                  {t("app.settings.news.open")}
                </button>
              </div>
            </div>
          </Modal>

      <Modal
        isOpen={isNewsModalOpen}
        title={t("news.title")}
        onClose={closeNewsModal}
        footer={
          <button type="button" onClick={closeNewsModal} style={buttons.primary}>
            {t("common.close")}
          </button>
        }
      >
        <div style={{ display: "grid", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <button
              type="button"
              onClick={() => switchLanguageFromNews("fr")}
              style={{
                ...buttons.icon,
                width: "40px",
                height: "32px",
                border:
                  language === "fr"
                    ? `2px solid ${colors.primary}`
                    : `1px solid ${colors.border}`,
                background: language === "fr" ? colors.primary : colors.secondary,
              }}
              aria-label={t("lang.fr")}
              title={t("lang.fr")}
            >
              <img
                src={flagFr}
                alt={t("lang.fr")}
                style={{ width: "22px", height: "16px", borderRadius: "2px" }}
              />
            </button>
            <button
              type="button"
              onClick={() => switchLanguageFromNews("en")}
              style={{
                ...buttons.icon,
                width: "40px",
                height: "32px",
                border:
                  language === "en"
                    ? `2px solid ${colors.primary}`
                    : `1px solid ${colors.border}`,
                background: language === "en" ? colors.primary : colors.secondary,
              }}
              aria-label={t("lang.en")}
              title={t("lang.en")}
            >
              <img
                src={flagGb}
                alt={t("lang.en")}
                style={{ width: "22px", height: "16px", borderRadius: "2px" }}
              />
            </button>
          </div>
          <p style={{ ...typography.pageSubtitle, textAlign: "left", margin: 0 }}>
            {t("news.intro")}
          </p>
          <ul style={{ margin: 0, paddingLeft: "18px", color: colors.textSoft, lineHeight: 1.45 }}>
            <li>{t("news.item.1")}</li>
            <li>{t("news.item.2")}</li>
            <li>{t("news.item.3")}</li>
            <li>{t("news.item.4")}</li>
          </ul>
          <p style={{ ...typography.pageSubtitle, textAlign: "left", marginBottom: 0 }}>
            {t("news.important")}
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={isTransferModalOpen}
        title={t("app.transfer.title")}
        onClose={closeTransferModal}
        footer={
          <>
            <button onClick={handleExecuteTransfer} style={buttons.primary}>
            {transferAction === "import"
                ? t("app.transfer.chooseFile")
                : t("app.transfer.download")}
            </button>
            <button onClick={closeTransferModal} style={buttons.secondary}>
            {t("common.cancel")}
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gap: "12px" }}>
          <div>
            <label style={typography.label}>{t("app.transfer.action")}</label>
            <select
              value={transferAction}
              onChange={(event) =>
                handleTransferActionChange(event.target.value as TransferAction)
              }
              style={controls.select}
            >
              <option value="import">{t("app.transfer.import")}</option>
              <option value="export">{t("app.transfer.export")}</option>
            </select>
          </div>

          <div>
            <label style={typography.label}>{t("app.transfer.scope")}</label>
            <select
              value={transferScope}
              onChange={(event) =>
                handleTransferScopeChange(event.target.value as TransferScope)
              }
              style={controls.select}
            >
              <option value="global">{t("app.transfer.scope.global")}</option>
              <option value="table">{t("app.transfer.scope.table")}</option>
              {transferAction === "import" ? (
                <option value="new-table">{t("app.transfer.scope.newTable")}</option>
              ) : null}
            </select>
          </div>

          <div>
            <label style={typography.label}>{t("app.transfer.format")}</label>
            <select
              value={transferFormat}
              onChange={(event) => setTransferFormat(event.target.value as TransferFormat)}
              style={controls.select}
            >
              {getAvailableTransferFormats(transferAction, transferScope).map((format) => (
                <option key={format} value={format}>
                  {format.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {transferScope === "table" ? (
            <div>
              <label style={typography.label}>{t("app.transfer.table")}</label>
              <select
                value={transferTableId}
                onChange={(event) => setTransferTableId(event.target.value)}
                style={controls.select}
              >
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {transferAction === "import" &&
          transferScope === "table" &&
          transferFormat === "csv" ? (
            <div>
              <label style={typography.label}>{t("app.transfer.importMode")}</label>
              <select
                value={transferImportMode}
                onChange={(event) => setTransferImportMode(event.target.value as ImportMode)}
                style={controls.select}
              >
                <option value="append">{t("app.transfer.mode.append")}</option>
                <option value="replace">{t("app.transfer.mode.replace")}</option>
              </select>
            </div>
          ) : null}
        </div>
      </Modal>

      <RollDialog
        key={`roll-dialog-${language}`}
        isOpen={rollingTable !== null}
        currentSystem={currentSystem}
        tableName={rollingTable?.name ?? ""}
        tableItems={rollingTable?.items ?? []}
        availableCategories={
          rollingTable ? getAvailableCategories(rollingTable) : []
        }
        initialOptions={lastRollOptions}
        onClose={handleCloseRollDialog}
        onConfirm={handleConfirmRoll}
        onShowAlert={(message) => setAlertMessage(message)}
      />

      <ResultDialog
        key={`result-dialog-${language}`}
        isOpen={rollResult !== null}
        result={rollResult}
        history={rollHistory}
        onClose={handleCloseResultDialog}
        onReroll={handleReroll}
        onValidate={handleValidateRoll}
        onShowAlert={(message) => setAlertMessage(message)}
        playerRole={playerRole}
      />

      <ConfirmModal
        isOpen={tableIdToDelete !== null}
        title={t("app.delete.title")}
        message={t("app.delete.message")}
        confirmLabel={t("app.delete.confirm")}
        cancelLabel={t("common.cancel")}
        onConfirm={confirmDeleteTable}
        onCancel={cancelDeleteTable}
      />

      <AlertModal
        isOpen={alertMessage !== null}
        title={t("app.info.title")}
        message={alertMessage ?? ""}
        onClose={() => setAlertMessage(null)}
      />
    </div>
  );
}