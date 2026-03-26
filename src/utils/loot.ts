import type {
  LootCategory,
  LootItem,
  LootRarity,
  ProbabilityMode,
  RollOptions,
  RollResult,
  RolledLootItem,
  LootTable,
} from "../types";

function getRarityWeight(rarity: LootRarity): number {
  if (rarity === "Aucun") return 100;
  if (rarity === "Courant") return 100;
  if (rarity === "Commun (niv 1)") return 100;
  if (rarity === "Peu courant") return 40;
  if (rarity === "Peu commun (niv 1)") return 40;
  if (rarity === "Rare") return 10;
  if (rarity === "Très rare (niv 11)") return 3;
  if (rarity === "Légendaire (niv 17)") return 1;
  if (rarity === "Artéfact") return 0.5;
  return 1;
}

function getValueInCopper(item: LootItem): number {
  if (item.valueCurrency === "pc") return item.valueAmount * 1;
  if (item.valueCurrency === "pa") return item.valueAmount * 10;
  if (item.valueCurrency === "pe") return item.valueAmount * 50;
  if (item.valueCurrency === "po") return item.valueAmount * 100;
  return item.valueAmount * 1000;
}

function getLevelFactor(
  itemLevel: number,
  minLevel: number,
  maxLevel: number,
  mode: ProbabilityMode
): number {
  const lowDistance = itemLevel - minLevel + 1;
  const highDistance = maxLevel - itemLevel + 1;

  if (lowDistance <= 0 || highDistance <= 0) {
    return 0;
  }

  if (mode === "balanced") {
    return 1;
  }

  if (mode === "low-soft") {
    return Math.pow(highDistance, 1.5);
  }

  if (mode === "low-strong") {
    return Math.pow(highDistance, 2);
  }

  if (mode === "high-soft") {
    return Math.pow(lowDistance, 1.5);
  }

  if (mode === "high-strong") {
    return Math.pow(lowDistance, 2);
  }

  return 1;
}

function getEffectiveWeight(
  item: LootItem,
  minLevel: number,
  maxLevel: number,
  mode: ProbabilityMode
): number {
  if (item.level < minLevel || item.level > maxLevel) return 0;

  const rarityWeight = getRarityWeight(item.rarity);
  const levelFactor = getLevelFactor(item.level, minLevel, maxLevel, mode);

  return rarityWeight * levelFactor;
}

function weightedPick(items: RolledLootItem[]): RolledLootItem | null {
  const totalWeight = items.reduce((sum, item) => sum + item.effectiveWeight, 0);

  if (totalWeight <= 0) {
    return null;
  }

  let roll = Math.random() * totalWeight;

  for (const item of items) {
    roll -= item.effectiveWeight;
    if (roll <= 0) {
      return item;
    }
  }

  return items[items.length - 1] ?? null;
}

export function getAvailableCategories(table: LootTable): LootCategory[] {
  const categories = new Set<LootCategory>();

  for (const item of table.items) {
    categories.add(item.category);
  }

  return Array.from(categories).sort();
}

export function getProbabilityModeLabel(mode: ProbabilityMode): string {
  if (mode === "balanced") return "Équilibré";
  if (mode === "low-soft") return "Favorise légèrement les bas niveaux";
  if (mode === "low-strong") return "Favorise fortement les bas niveaux";
  if (mode === "high-soft") return "Favorise légèrement les hauts niveaux";
  if (mode === "high-strong") return "Favorise fortement les hauts niveaux";
  return "Rareté uniquement";
}

function getRandomInt(min: number, max: number): number {
  if (max <= min) return min;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function rollLootTable(
  table: LootTable,
  options: RollOptions
): RollResult {
  const filteredBaseItems = table.items.filter((item) => {
    const matchesLevel =
      item.level >= options.minLevel && item.level <= options.maxLevel;
    const matchesCategory =
      options.categories.length === 0 ||
      options.categories.includes(item.category);
    const itemValuePc = getValueInCopper(item);
    const matchesValue =
      itemValuePc >= options.minValuePc && itemValuePc <= options.maxValuePc;

    return matchesLevel && matchesCategory && matchesValue;
  });

  const weightedItems: RolledLootItem[] = filteredBaseItems
    .map((item) => ({
      ...item,
      effectiveWeight: getEffectiveWeight(
        item,
        options.minLevel,
        options.maxLevel,
        options.probabilityMode
      ),
      valueInCopper: getValueInCopper(item),
    }))
    .filter((item) => item.effectiveWeight > 0);

  const pool = [...weightedItems];
  const results: RolledLootItem[] = [];

  const quantity = getRandomInt(options.minQuantity, options.maxQuantity);

  for (let i = 0; i < quantity; i += 1) {
    const picked = weightedPick(pool);

    if (!picked) {
      break;
    }

    results.push(picked);

    if (!options.allowDuplicates) {
      const pickedIndex = pool.findIndex((item) => item.id === picked.id);
      if (pickedIndex >= 0) {
        pool.splice(pickedIndex, 1);
      }
    }
  }

  return {
    tableId: table.id,
    tableName: table.name,
    options,
    items: results,
    rolledAt: new Date().toISOString(),
  };
}