import type {
  GameSystem,
  ItemSortMode,
  LootCategory,
  LootCurrency,
  LootItem,
  LootRarity,
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
  allowMagic: true,
  probabilityMode: "balanced",
};

const DEFAULT_UI_STATE: UIState = {
  currentSystem: "PF2E",
  searchTerm: "",
  tableSortMode: "updated-desc",
  expandedTableIds: [],
  itemSortModes: {},
  lastRollOptions: DEFAULT_ROLL_OPTIONS,
};

function normalizeCategory(value: string): LootCategory {
  const normalized = value.trim().toLowerCase();

  if (normalized === "arme" || normalized === "armes" || normalized === "weapon" || normalized === "weapons") {
    return "Armes";
  }

  if (normalized === "armure" || normalized === "armures" || normalized === "armor" || normalized === "armors") {
    return "Armures";
  }

  if (normalized === "consommable" || normalized === "consumable") return "Consommable";
  if (normalized === "contenant" || normalized === "container") return "Contenant";
  if (normalized === "equipement" || normalized === "équipement" || normalized === "equipment") return "Equipement";
  if (normalized === "équipement d'aventurier" || normalized === "equipement d'aventurier" || normalized === "adventuring gear") {
    return "Équipement d'aventurier";
  }
  if (normalized === "outils" || normalized === "tools") return "Outils";
  if (normalized === "montures et véhicules" || normalized === "mounts & vehicles") return "Montures et véhicules";
  if (normalized === "marchandises" || normalized === "trade goods") return "Marchandises";
  if (normalized === "objets magiques" || normalized === "magic items") return "Objets magiques";
  if (normalized === "poisons" || normalized === "poison") return "Poisons";
  if (normalized === "herbes" || normalized === "herbs") return "Herbes";
  if (normalized === "trésor" || normalized === "tresor" || normalized === "treasure") return "Trésor";

  return "Autre";
}

function normalizeRarity(value: string): LootRarity {
  const normalized = value.trim().toLowerCase();

  if (normalized === "aucun" || normalized === "none") return "Aucun";
  if (normalized === "courant" || normalized === "common" || normalized === "common (lvl 1)" || normalized === "commun (niv 1)") return "Courant";
  if (normalized === "peu courant" || normalized === "uncommon" || normalized === "uncommon (lvl 1)" || normalized === "peu commun (niv 1)") return "Peu courant";
  if (normalized === "rare") return "Rare";
   if (normalized === "très rare" || normalized === "tres rare" || normalized === "very rare" || normalized === "very rare (lvl 11)" || normalized === "très rare (niv 11)" || normalized === "tres rare (niv 11)") {
    return "Très rare";
  }
  if (normalized === "légendaire" || normalized === "legendaire" || normalized === "legendary" || normalized === "legendary (lvl 17)" || normalized === "légendaire (niv 17)" || normalized === "legendaire (niv 17)") {
    return "Légendaire";
  }
  if (normalized === "artéfact" || normalized === "artefact" || normalized === "artifact") return "Artéfact";
  if (normalized === "unique") return "Unique";

  return "Aucun";
}

function normalizeType(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "Aucun";

  if (normalized === "none") return "Aucun";
  if (normalized === "ring") return "Anneau";
  if (normalized === "weapon") return "Arme";
  if (normalized === "armor") return "Armure";
  if (normalized === "wand") return "Baguette";
  if (normalized === "staff") return "Bâton";
  if (normalized === "wondrous item") return "Objets merveilleux";
  if (normalized === "scroll") return "Parchemin";
  if (normalized === "potion") return "Potion";
  if (normalized === "rod") return "Sceptre";
  if (normalized === "plant") return "Plante";
  if (normalized === "venom") return "Venin";
  if (normalized === "toxin") return "Toxine";
  if (normalized === "mixture") return "Mixture";
  if (normalized === "altering") return "Altérant";
  if (normalized === "antidote") return "Antipoison";
  if (normalized === "healing") return "Curatif";
  if (normalized === "booster") return "Dopant";
  if (normalized === "fortifying") return "Fortifiant";

  return value.trim() || "Aucun";
}

function normalizeCurrency(value: string, system: GameSystem): LootCurrency {
  const normalized = value.trim().toLowerCase();
  if (normalized === "pc" || normalized === "cp") return "pc";
  if (normalized === "pa" || normalized === "sp") return "pa";
  if (normalized === "po" || normalized === "gp") return "po";
  if (normalized === "pp") return "pp";
  if ((normalized === "pe" || normalized === "ep") && system === "DND5E") return "pe";

  return "pc";
}

function normalizeMagic(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["yes", "oui", "true", "1", "y", "o"].includes(normalized)) return true;
    if (["no", "non", "false", "0", "n"].includes(normalized)) return false;
  }
  return false;
}

function normalizeItem(item: Partial<LootItem>, system: GameSystem): LootItem {
  return {
    id: item.id ?? crypto.randomUUID(),
    name: (item.name ?? "").trim(),
    url: (item.url ?? "").trim(),
    level: Number(item.level) || 0,
    category: normalizeCategory(item.category ?? ""),
    magic: normalizeMagic(item.magic),
    type: normalizeType(item.type ?? "Aucun"),
    rarity: normalizeRarity(item.rarity ?? ""),
    valueAmount: Number(item.valueAmount) || 0,
    valueCurrency: normalizeCurrency(item.valueCurrency ?? "pc", system),
  };
}

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
        ? table.items.map((item: LootItem) => normalizeItem(item, system))
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
      currentSystem:
        parsed?.currentSystem === "DND5E" || parsed?.currentSystem === "PF2E"
          ? parsed.currentSystem
          : DEFAULT_UI_STATE.currentSystem,
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
              allowMagic:
                typeof parsed.lastRollOptions.allowMagic === "boolean"
                  ? parsed.lastRollOptions.allowMagic
                  : DEFAULT_ROLL_OPTIONS.allowMagic,
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
      ? ["name", "url", "level", "category", "rarity", "magic", "valueAmount", "valueCurrency"]
      : ["name", "url", "category", "type", "rarity", "valueAmount", "valueCurrency"];

    const rows = table.items.map((item) =>
      isPf2e
        ? [
            escapeCsvValue(item.name),
            escapeCsvValue(item.url),
            escapeCsvValue(item.level),
            escapeCsvValue(item.category),
            escapeCsvValue(item.rarity),
            escapeCsvValue(item.magic ? "yes" : "no"),
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

  return parsed.map((table) => ({
    ...table,
    system: table.system === "DND5E" ? "DND5E" : "PF2E",
    items: Array.isArray(table.items)
      ? table.items.map((item: LootItem) =>
          normalizeItem(item, table.system === "DND5E" ? "DND5E" : "PF2E")
        )
      : [],
  }));
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
      ? ["name", "url", "level", "category", "rarity", "magic", "valueAmount", "valueCurrency"]
      : ["name", "url", "category", "type", "rarity", "valueAmount", "valueCurrency"];
  const legacyPf2eHeader = ["name", "url", "level", "category", "rarity", "valueAmount", "valueCurrency"];

  const normalizedHeader = header.map((value) => value.replace(/^\uFEFF/, ""));

  const isHeaderValid =
    normalizedHeader.length === expectedHeader.length &&
    normalizedHeader.every((value, index) => value === expectedHeader[index]);
  const isLegacyPf2eHeader =
    system === "PF2E" &&
    normalizedHeader.length === legacyPf2eHeader.length &&
    normalizedHeader.every((value, index) => value === legacyPf2eHeader[index]);

  if (!isHeaderValid && !isLegacyPf2eHeader) {
    throw new Error("En-tête CSV invalide.");
  }

  const items: LootItem[] = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);

    const expectedLength = isLegacyPf2eHeader ? legacyPf2eHeader.length : expectedHeader.length;

    if (values.length !== expectedLength) {
      throw new Error("Une ligne CSV est invalide.");
    }

    if (system === "PF2E") {
      const isLegacy = isLegacyPf2eHeader;
      return {
        id: crypto.randomUUID(),
        name: values[0],
        url: values[1],
        level: Number(values[2]) || 0,
        category: normalizeCategory(values[3]),
        magic: isLegacy ? false : normalizeMagic(values[5]),
        type: "Aucun",
        rarity: normalizeRarity(values[4]),
        valueAmount: Number(values[isLegacy ? 5 : 6]) || 0,
        valueCurrency: normalizeCurrency(values[isLegacy ? 6 : 7], system),
      };
    }

    return {
      id: crypto.randomUUID(),
      name: values[0],
      url: values[1],
      level: 0,
      category: normalizeCategory(values[2]),
      magic: false,
      type: normalizeType(values[3] || "Aucun"),
      rarity: normalizeRarity(values[4]),
      valueAmount: Number(values[5]) || 0,
      valueCurrency: normalizeCurrency(values[6], system),
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
      ? ["name", "url", "level", "category", "rarity", "magic", "valueAmount", "valueCurrency"]
      : ["name", "url", "category", "type", "rarity", "valueAmount", "valueCurrency"];
  const legacyPf2eHeader = ["name", "url", "level", "category", "rarity", "valueAmount", "valueCurrency"];

  const normalizedHeader = header.map((value) => value.replace(/^\uFEFF/, ""));

  const isHeaderValid =
    normalizedHeader.length === expectedHeader.length &&
    normalizedHeader.every((value, index) => value === expectedHeader[index]);
  const isLegacyPf2eHeader =
    system === "PF2E" &&
    normalizedHeader.length === legacyPf2eHeader.length &&
    normalizedHeader.every((value, index) => value === legacyPf2eHeader[index]);

  if (!isHeaderValid && !isLegacyPf2eHeader) {
    throw new Error("En-tête CSV invalide.");
  }

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);

    const expectedLength = isLegacyPf2eHeader ? legacyPf2eHeader.length : expectedHeader.length;

    if (values.length !== expectedLength) {
      throw new Error("Une ligne CSV est invalide.");
    }

    if (system === "PF2E") {
      const isLegacy = isLegacyPf2eHeader;
      return {
        id: crypto.randomUUID(),
        name: values[0],
        url: values[1],
        level: Number(values[2]) || 0,
        category: normalizeCategory(values[3]),
        magic: isLegacy ? false : normalizeMagic(values[5]),
        type: "Aucun",
        rarity: normalizeRarity(values[4]),
        valueAmount: Number(values[isLegacy ? 5 : 6]) || 0,
        valueCurrency: normalizeCurrency(values[isLegacy ? 6 : 7], system),
      };
    }

    return {
      id: crypto.randomUUID(),
      name: values[0],
      url: values[1],
      level: 0,
      category: normalizeCategory(values[2]),
      magic: false,
      type: normalizeType(values[3] || "Aucun"),
      rarity: normalizeRarity(values[4]),
      valueAmount: Number(values[5]) || 0,
      valueCurrency: normalizeCurrency(values[6], system),
    };
  });
}