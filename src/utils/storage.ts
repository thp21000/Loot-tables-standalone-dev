import type {
  GameSystem,
  ItemSortMode,
  LootItem,
  LootTable,
  RollOptions,
  TableSortMode,
  UIState,
} from "../types";

const STORAGE_KEY_PREFIX = "owlbear-loot-tables";
const UI_STATE_KEY = "owlbear-loot-tables-ui-state";

function getStorageKey(system: GameSystem): string {
  return `${STORAGE_KEY_PREFIX}-${system.toLowerCase()}`;
}

const DEFAULT_ROLL_OPTIONS: RollOptions = {
  minLevel: 0,
  maxLevel: 1,
  minQuantity: 1,
  maxQuantity: 1,
  minValuePc: 0,
  maxValuePc: 1000000,
  categories: [],
  allowDuplicates: false,
  probabilityMode: "balanced",
};

const DEFAULT_UI_STATE: UIState = {
  searchTerm: "",
  tableSortMode: "updated-desc",
  expandedTableIds: [],
  itemSortModes: {},
  lastRollOptions: DEFAULT_ROLL_OPTIONS,
};

export function loadTables(system: GameSystem): LootTable[] {
  try {
    const raw = localStorage.getItem(getStorageKey(system));
    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((table) => ({
      ...table,
      system,
      items: Array.isArray(table.items)
        ? table.items.map((item: LootItem) => ({
            ...item,
            type: item.type ?? "Aucun",
          }))
        : [],
    }));
  } catch (error) {
    console.error("Erreur lors du chargement des tables :", error);
    return [];
  }
}

export function saveTables(tables: LootTable[], system: GameSystem): void {
  try {
    localStorage.setItem(getStorageKey(system), JSON.stringify(tables));
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des tables :", error);
  }
}

export function loadUIState(): UIState {
  try {
    const raw = localStorage.getItem(UI_STATE_KEY);
    if (!raw) {
      return DEFAULT_UI_STATE;
    }

    const parsed = JSON.parse(raw);

    return {
      searchTerm:
        typeof parsed?.searchTerm === "string"
          ? parsed.searchTerm
          : DEFAULT_UI_STATE.searchTerm,
      tableSortMode:
        typeof parsed?.tableSortMode === "string"
          ? (parsed.tableSortMode as TableSortMode)
          : DEFAULT_UI_STATE.tableSortMode,
      expandedTableIds: Array.isArray(parsed?.expandedTableIds)
        ? parsed.expandedTableIds.filter((value: unknown) => typeof value === "string")
        : DEFAULT_UI_STATE.expandedTableIds,
      itemSortModes:
        parsed?.itemSortModes && typeof parsed.itemSortModes === "object"
          ? (parsed.itemSortModes as Record<string, ItemSortMode>)
          : DEFAULT_UI_STATE.itemSortModes,
      lastRollOptions:
        parsed?.lastRollOptions && typeof parsed.lastRollOptions === "object"
          ? {
              maxLevel:
                typeof parsed.lastRollOptions.maxLevel === "number"
                  ? parsed.lastRollOptions.maxLevel
                  : DEFAULT_ROLL_OPTIONS.maxLevel,
              minLevel:
                typeof parsed.lastRollOptions.minLevel === "number"
                  ? parsed.lastRollOptions.minLevel
                  : DEFAULT_ROLL_OPTIONS.minLevel,
              minQuantity:
                typeof parsed.lastRollOptions.minQuantity === "number"
                  ? parsed.lastRollOptions.minQuantity
                  : typeof parsed.lastRollOptions.quantity === "number"
                    ? parsed.lastRollOptions.quantity
                    : DEFAULT_ROLL_OPTIONS.minQuantity,
              maxQuantity:
                typeof parsed.lastRollOptions.maxQuantity === "number"
                  ? parsed.lastRollOptions.maxQuantity
                  : typeof parsed.lastRollOptions.quantity === "number"
                    ? parsed.lastRollOptions.quantity
                    : DEFAULT_ROLL_OPTIONS.maxQuantity,
              minValuePc:
                typeof parsed.lastRollOptions.minValuePc === "number"
                  ? parsed.lastRollOptions.minValuePc
                  : DEFAULT_ROLL_OPTIONS.minValuePc,
              maxValuePc:
                typeof parsed.lastRollOptions.maxValuePc === "number"
                  ? parsed.lastRollOptions.maxValuePc
                  : DEFAULT_ROLL_OPTIONS.maxValuePc,
              categories: Array.isArray(parsed.lastRollOptions.categories)
                ? parsed.lastRollOptions.categories
                : DEFAULT_ROLL_OPTIONS.categories,
              allowDuplicates:
                typeof parsed.lastRollOptions.allowDuplicates === "boolean"
                  ? parsed.lastRollOptions.allowDuplicates
                  : DEFAULT_ROLL_OPTIONS.allowDuplicates,
              probabilityMode:
                typeof parsed.lastRollOptions.probabilityMode === "string"
                  ? parsed.lastRollOptions.probabilityMode
                  : DEFAULT_ROLL_OPTIONS.probabilityMode,
            }
          : DEFAULT_UI_STATE.lastRollOptions,
    };
  } catch (error) {
    console.error("Erreur lors du chargement de l’état UI :", error);
    return DEFAULT_UI_STATE;
  }
}

export function saveUIState(state: UIState): void {
  try {
    localStorage.setItem(UI_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de l’état UI :", error);
  }
}

function downloadTextFile(
  content: string,
  fileName: string,
  mimeType: string
): void {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM, content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
}

function sanitizeFileName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

export function exportTablesToJson(tables: LootTable[]): void {
  try {
    const dataStr = JSON.stringify(tables, null, 2);
    const now = new Date();
    const fileName = `loot-tables-${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}.json`;

    downloadTextFile(dataStr, fileName, "application/json");
  } catch (error) {
    console.error("Erreur lors de l’export JSON :", error);
    window.alert("Impossible d’exporter les tables.");
  }
}

export function exportSingleTableToJson(table: LootTable): void {
  try {
    const dataStr = JSON.stringify(table, null, 2);
    const fileName = `${sanitizeFileName(table.name || "table")}.json`;

    downloadTextFile(dataStr, fileName, "application/json");
  } catch (error) {
    console.error("Erreur lors de l’export JSON de la table :", error);
    window.alert("Impossible d’exporter cette table en JSON.");
  }
}

function escapeCsvValue(value: string | number): string {
  const stringValue = String(value ?? "");
  const escaped = stringValue.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function exportSingleTableToCsv(table: LootTable): void {
  try {
    const isPf2e = table.system === "PF2E";
    const header = isPf2e
      ? ["name", "url", "level", "category", "rarity", "valueAmount", "valueCurrency"]
      : ["name", "url", "category", "type", "rarity", "valueAmount", "valueCurrency"];

    const rows = table.items.map((item) =>
      isPf2e
        ? [
            escapeCsvValue(item.name),
            escapeCsvValue(item.url),
            escapeCsvValue(item.level),
            escapeCsvValue(item.category),
            escapeCsvValue(item.rarity),
            escapeCsvValue(item.valueAmount),
            escapeCsvValue(item.valueCurrency),
          ].join(";")
        : [
            escapeCsvValue(item.name),
            escapeCsvValue(item.url),
            escapeCsvValue(item.category),
            escapeCsvValue(item.type ?? "Aucun"),
            escapeCsvValue(item.rarity),
            escapeCsvValue(item.valueAmount),
            escapeCsvValue(item.valueCurrency),
          ].join(";")
    );

    const content = [header.join(";"), ...rows].join("\n");
    const fileName = `${sanitizeFileName(table.name || "table")}.csv`;

    downloadTextFile(content, fileName, "text/csv;charset=utf-8");
  } catch (error) {
    console.error("Erreur lors de l’export CSV de la table :", error);
    window.alert("Impossible d’exporter cette table en CSV.");
  }
}

function isValidLootTableArray(data: unknown): data is LootTable[] {
  if (!Array.isArray(data)) {
    return false;
  }

  return data.every((table) => {
    if (!table || typeof table !== "object") {
      return false;
    }

    const candidate = table as Record<string, unknown>;

    return (
      typeof candidate.id === "string" &&
      typeof candidate.name === "string" &&
      typeof candidate.createdAt === "string" &&
      typeof candidate.updatedAt === "string" &&
      Array.isArray(candidate.items)
    );
  });
}

export async function importTablesFromFile(file: File): Promise<LootTable[]> {
  const text = await file.text();
  const parsed = JSON.parse(text);

  if (!isValidLootTableArray(parsed)) {
    throw new Error("Format JSON invalide.");
  }

  return parsed;
}

export function mergeImportedTables(
  currentTables: LootTable[],
  importedTables: LootTable[]
): LootTable[] {
  const existingIds = new Set(currentTables.map((table) => table.id));

  const normalizedImportedTables = importedTables.map((table) => {
    if (!existingIds.has(table.id)) {
      return table;
    }

    return {
      ...table,
      id: crypto.randomUUID(),
      name: `${table.name} (importée)`,
      updatedAt: new Date().toISOString(),
    };
  });

  return [...currentTables, ...normalizedImportedTables];
}

export function duplicateTable(table: LootTable): LootTable {
  const now = new Date().toISOString();

  return {
    ...table,
    id: crypto.randomUUID(),
    name: `${table.name} (copie)`,
    items: table.items.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
    })),
    createdAt: now,
    updatedAt: now,
  };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ";" && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result.map((value) => value.trim());
}

async function readFileAsUtf8(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const decoder = new TextDecoder("utf-8");
  return decoder.decode(buffer);
}

export async function importSingleTableFromCsv(
  file: File,
  tableNameFromFile?: string,
  system: GameSystem = "PF2E"
): Promise<LootTable> {
  const text = await readFileAsUtf8(file);

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("Le CSV est vide ou incomplet.");
  }

  const header = parseCsvLine(lines[0]);

  const expectedHeader =
    system === "PF2E"
      ? ["name", "url", "level", "category", "rarity", "valueAmount", "valueCurrency"]
      : ["name", "url", "category", "type", "rarity", "valueAmount", "valueCurrency"];

  const normalizedHeader = header.map((value) => value.replace(/^\uFEFF/, ""));

  const isHeaderValid =
    normalizedHeader.length === expectedHeader.length &&
    normalizedHeader.every((value, index) => value === expectedHeader[index]);

  if (!isHeaderValid) {
    throw new Error("En-tête CSV invalide.");
  }

  const items: LootItem[] = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);

    if (values.length !== expectedHeader.length) {
      throw new Error("Une ligne CSV est invalide.");
    }

    if (system === "PF2E") {
      return {
        id: crypto.randomUUID(),
        name: values[0],
        url: values[1],
        level: Number(values[2]) || 0,
        category: (values[3] as LootItem["category"]) || "Autre",
        type: "Aucun",
        rarity: (values[4] as LootItem["rarity"]) || "Courant",
        valueAmount: Number(values[5]) || 0,
        valueCurrency: (values[6] as LootItem["valueCurrency"]) || "pc",
      };
    }

    return {
      id: crypto.randomUUID(),
      name: values[0],
      url: values[1],
      level: 0,
      category: (values[2] as LootItem["category"]) || "Autre",
      type: values[3] || "Aucun",
      rarity: (values[4] as LootItem["rarity"]) || "Aucun",
      valueAmount: Number(values[5]) || 0,
      valueCurrency: (values[6] as LootItem["valueCurrency"]) || "pc",
    };
  });

  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    name: tableNameFromFile || file.name.replace(/\.csv$/i, "") || "Table importée",
    system,
    items,
    createdAt: now,
    updatedAt: now,
  };
}

export async function importItemsFromCsvFile(
  file: File,
  system: GameSystem = "PF2E"
): Promise<LootItem[]> {
  const text = await readFileAsUtf8(file);

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("Le CSV est vide ou incomplet.");
  }

  const header = parseCsvLine(lines[0]);
  const expectedHeader =
    system === "PF2E"
      ? ["name", "url", "level", "category", "rarity", "valueAmount", "valueCurrency"]
      : ["name", "url", "category", "type", "rarity", "valueAmount", "valueCurrency"];

  const normalizedHeader = header.map((value) => value.replace(/^\uFEFF/, ""));

  const isHeaderValid =
    normalizedHeader.length === expectedHeader.length &&
    normalizedHeader.every((value, index) => value === expectedHeader[index]);

  if (!isHeaderValid) {
    throw new Error("En-tête CSV invalide.");
  }

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);

    if (values.length !== expectedHeader.length) {
      throw new Error("Une ligne CSV est invalide.");
    }

    if (system === "PF2E") {
      return {
        id: crypto.randomUUID(),
        name: values[0],
        url: values[1],
        level: Number(values[2]) || 0,
        category: (values[3] as LootItem["category"]) || "Autre",
        type: "Aucun",
        rarity: (values[4] as LootItem["rarity"]) || "Courant",
        valueAmount: Number(values[5]) || 0,
        valueCurrency: (values[6] as LootItem["valueCurrency"]) || "pc",
      };
    }

    return {
      id: crypto.randomUUID(),
      name: values[0],
      url: values[1],
      level: 0,
      category: (values[2] as LootItem["category"]) || "Autre",
      type: values[3] || "Aucun",
      rarity: (values[4] as LootItem["rarity"]) || "Aucun",
      valueAmount: Number(values[5]) || 0,
      valueCurrency: (values[6] as LootItem["valueCurrency"]) || "pc",
    };
  });
}