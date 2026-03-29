import type { Language } from "./index";
import type { GameSystem, LootCurrency } from "../types";

const categoryEn: Record<string, string> = {
  Arme: "Weapon",
  Armes: "Weapons",
  Armure: "Armor",
  Armures: "Armors",
  Consommable: "Consumable",
  Contenant: "Container",
  Equipement: "Equipment",
  "Équipement d'aventurier": "Adventuring gear",
  Outils: "Tools",
  "Montures et véhicules": "Mounts & vehicles",
  Marchandises: "Trade goods",
  "Objets magiques": "Magic items",
  Poisons: "Poisons",
  Herbes: "Herbs",
  Trésor: "Treasure",
  Autre: "Other",
};

const rarityEn: Record<string, string> = {
  Aucun: "None",
  None: "None",
  Courant: "Common",
  "Peu courant": "Uncommon",
  Rare: "Rare",
  "Très rare": "Very Rare",
  "Légendaire": "Legendary",
  "Artéfact": "Artifact",
  Unique: "Unique",
  Artifact: "Artifact",
};

const typeEn: Record<string, string> = {
  Aucun: "None",
  Anneau: "Ring",
  Arme: "Weapon",
  Armure: "Armor",
  Baguette: "Wand",
  "Bâton": "Staff",
  "Objets merveilleux": "Wondrous item",
  Parchemin: "Scroll",
  Potion: "Potion",
  Sceptre: "Rod",
  Plante: "Plant",
  Venin: "Venom",
  Toxine: "Toxin",
  Mixture: "Mixture",
  "Altérant": "Altering",
  Antipoison: "Antidote",
  Curatif: "Healing",
  Dopant: "Booster",
  Fortifiant: "Fortifying",
};

const currencyEn: Record<LootCurrency, string> = {
  pc: "cp",
  pa: "sp",
  pe: "ep",
  po: "gp",
  pp: "pp",
};

function fromMap(value: string, language: Language, map: Record<string, string>): string {
  const normalizedValue = value.trim();
  if (language === "fr") {
    return normalizedValue;
  }

  if (map[normalizedValue]) {
    return map[normalizedValue];
  }

  const canonicalize = (term: string) =>
    term
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const canonicalValue = canonicalize(normalizedValue);

  for (const [source, translated] of Object.entries(map)) {
    if (canonicalize(source) === canonicalValue) {
      return translated;
    }
  }

  return normalizedValue;
}

export function tCategory(value: string, language: Language): string {
  return fromMap(value, language, categoryEn);
}

export function tRarity(value: string, language: Language): string {
  return fromMap(value, language, rarityEn);
}

export function tType(value: string, language: Language): string {
  return fromMap(value, language, typeEn);
}

export function getCurrencyOptions(system: GameSystem): LootCurrency[] {
  if (system === "PF2E") {
    return ["pc", "pa", "po", "pp"];
  }

  return ["pc", "pa", "pe", "po", "pp"];
}

export function tCurrency(value: LootCurrency, language: Language): string {
  if (language === "fr") {
    return value;
  }

  return currencyEn[value] ?? value;
}
