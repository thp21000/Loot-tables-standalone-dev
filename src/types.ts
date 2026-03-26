export type GameSystem = "PF2E" | "DND5E";

export type LootCategory =
  | "Arme"
  | "Armes"
  | "Armure"
  | "Armures"
  | "Consommable"
  | "Contenant"
  | "Equipement"
  | "Équipement d'aventurier"
  | "Outils"
  | "Montures et véhicules"
  | "Marchandises"
  | "Objets magiques"
  | "Poisons"
  | "Herbes"
  | "Trésor"
  | "Autre";

  export type LootRarity =
  | "Aucun"
  | "Courant"
  | "Peu courant"
  | "Rare"
  | "Unique"
  | "Commun (niv 1)"
  | "Peu commun (niv 1)"
  | "Très rare (niv 11)"
  | "Légendaire (niv 17)"
  | "Artéfact";

export type LootCurrency = "pc" | "pa" | "pe" | "po" | "pp";

export type ProbabilityMode =
  | "balanced"
  | "low-soft"
  | "low-strong"
  | "high-soft"
  | "high-strong"
  | "rarity-only";

export type TableSortMode =
  | "updated-desc"
  | "updated-asc"
  | "name-asc"
  | "name-desc"
  | "count-desc"
  | "count-asc";

export type ItemSortMode =
  | "name-asc"
  | "name-desc"
  | "level-asc"
  | "level-desc"
  | "category-asc"
  | "category-desc"
  | "rarity-asc"
  | "rarity-desc"
  | "value-asc"
  | "value-desc";

export type ImportMode = "append" | "replace";

export type OwlbearPlayerRole = "GM" | "PLAYER" | "UNKNOWN";

export type LootItem = {
  id: string;
  name: string;
  url: string;
  level: number;
  category: LootCategory;
  type: string;
  rarity: LootRarity;
  valueAmount: number;
  valueCurrency: LootCurrency;
};

export type LootTable = {
  id: string;
  name: string;
  system: GameSystem;
  items: LootItem[];
  createdAt: string;
  updatedAt: string;
};

export type RollOptions = {
  minLevel: number;
  maxLevel: number;
  minQuantity: number;
  maxQuantity: number;
  minValuePc: number;
  maxValuePc: number;
  categories: LootCategory[];
  allowDuplicates: boolean;
  probabilityMode: ProbabilityMode;
};

export type RolledLootItem = LootItem & {
  effectiveWeight: number;
  valueInCopper: number;
};

export type RollResult = {
  tableId: string;
  tableName: string;
  options: RollOptions;
  items: RolledLootItem[];
  rolledAt: string;
};

export type UIState = {
  searchTerm: string;
  tableSortMode: TableSortMode;
  expandedTableIds: string[];
  itemSortModes: Record<string, ItemSortMode>;
  lastRollOptions: RollOptions;
};

export type ImportItemsResult = {
  importedCount: number;
  skippedDuplicatesCount: number;
  replaced: boolean;
};

export type ValidatedRollSummaryItem = {
  name: string;
  url: string;
  level: number;
  category: LootCategory;
  type: string;
  rarity: LootRarity;
  valueAmount: number;
  valueCurrency: LootCurrency;
};

export type ValidatedRollSummary = {
  tableId: string;
  tableName: string;
  validatedAt: string;
  validatedBy?: string | null;
  items: ValidatedRollSummaryItem[];
};

export type OwlbearRoomState = {
  lastOpenedAt?: string;
  lastRollTableId?: string | null;
  sharedNote?: string;
  lastValidatedRoll?: ValidatedRollSummary | null;
};

export type OwlbearContextState = {
  isOwlbearReady: boolean;
  roomId: string | null;
};

export type ValidatedRollBroadcast = {
  type: "validated-roll";
  payload: ValidatedRollSummary;
};