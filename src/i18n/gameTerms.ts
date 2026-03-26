import type { Language } from "./index";

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
  Courant: "Common",
  "Peu courant": "Uncommon",
  Rare: "Rare",
  Unique: "Unique",
  "Commun (niv 1)": "Common (lvl 1)",
  "Peu commun (niv 1)": "Uncommon (lvl 1)",
  "Très rare (niv 11)": "Very rare (lvl 11)",
  "Légendaire (niv 17)": "Legendary (lvl 17)",
  "Artéfact": "Artifact",
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

function fromMap(value: string, language: Language, map: Record<string, string>): string {
  const normalizedValue = value.trim();
  if (language === "fr") {
    return normalizedValue;
  }

  return map[normalizedValue] ?? normalizedValue;
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