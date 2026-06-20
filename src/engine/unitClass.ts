// Unit class derivation engine.
// Derives a tactical class for each Gigling based on their stat distribution.

import type { CardDisplay } from "@/types/card";

export type UnitClass = "TANK" | "ASSASSIN" | "MAGE" | "SUPPORT" | "BRUISER";

export interface UnitClassInfo {
  key: UnitClass;
  label: string;
  icon: string;
  color: string;
  description: string;
}

const CLASS_INFO: Record<UnitClass, UnitClassInfo> = {
  TANK: {
    key: "TANK",
    label: "Tank",
    icon: "Shield",
    color: "#3b82f6",
    description: "High HP and defense. Absorbs damage on the frontline.",
  },
  ASSASSIN: {
    key: "ASSASSIN",
    label: "Assassin",
    icon: "Crosshair",
    color: "#ef4444",
    description: "High attack and speed. Strikes fast from the midline.",
  },
  MAGE: {
    key: "MAGE",
    label: "Mage",
    icon: "Wand",
    color: "#a855f7",
    description: "High attack and luck. Deals magical damage from the backline.",
  },
  SUPPORT: {
    key: "SUPPORT",
    label: "Support",
    icon: "Heart",
    color: "#22c55e",
    description: "High health and luck. Heals and buffs from the backline.",
  },
  BRUISER: {
    key: "BRUISER",
    label: "Bruiser",
    icon: "Swords",
    color: "#f59e0b",
    description: "Balanced stats. A versatile fighter on the midline.",
  },
};

/**
 * Derive a unit class from a card's stats.
 * Priority: Tank > Assassin > Mage > Support > Bruiser
 */
export function deriveUnitClass(card: CardDisplay): UnitClass {
  const { attack, defense, speed, health, luck } = card;

  // Tank: tanky stats dominate
  if (health >= 70 && defense >= 60) return "TANK";

  // Assassin: fast + hard hitting
  if (attack >= 75 && speed >= 70) return "ASSASSIN";

  // Mage: high attack + luck (magical damage)
  if (attack >= 70 && luck >= 55) return "MAGE";

  // Support: sustain + utility
  if (health >= 65 && luck >= 50) return "SUPPORT";

  // Default: Bruiser
  return "BRUISER";
}

export function getUnitClassInfo(card: CardDisplay): UnitClassInfo {
  return CLASS_INFO[deriveUnitClass(card)];
}

/**
 * Get the battlefield row for a unit class.
 * 0 = Frontline, 1 = Midline, 2 = Backline
 */
export function getClassRow(unitClass: UnitClass): number {
  switch (unitClass) {
    case "TANK": return 0;      // Frontline
    case "BRUISER": return 1;   // Midline
    case "ASSASSIN": return 1;  // Midline
    case "MAGE": return 2;      // Backline
    case "SUPPORT": return 2;   // Backline
  }
}

// Faction-specific ability name overrides.
// Falls back to class defaults if faction has no specific name.
const FACTION_ABILITY_NAMES: Record<string, Record<UnitClass, string>> = {
  ATHENA: {
    TANK: "Aegis Barrier",
    ASSASSIN: "Phantom Strike",
    MAGE: "Arcane Blast",
    SUPPORT: "Wisdom Aura",
    BRUISER: "Spear Thrust",
  },
  ARCHON: {
    TANK: "Void Shield",
    ASSASSIN: "Shadow Step",
    MAGE: "Dark Pulse",
    SUPPORT: "Nether Heal",
    BRUISER: "Rift Slash",
  },
  FOXGLOVE: {
    TANK: "Thorn Wall",
    ASSASSIN: "Poison Fang",
    MAGE: "Nature's Wrath",
    SUPPORT: "Bloom Heal",
    BRUISER: "Vine Whip",
  },
  CRUSADER: {
    TANK: "Holy Bulwark",
    ASSASSIN: "Righteous Fury",
    MAGE: "Divine Smite",
    SUPPORT: "Sacred Light",
    BRUISER: "Crusade Charge",
  },
  CHOBO: {
    TANK: "Iron Hide",
    ASSASSIN: "Quick Slash",
    MAGE: "Spark Storm",
    SUPPORT: "Rally Cry",
    BRUISER: "Power Slam",
  },
  OVERSEER: {
    TANK: "Command Shield",
    ASSASSIN: "Ambush Strike",
    MAGE: "Mind Blast",
    SUPPORT: "Tactical Heal",
    BRUISER: "Overpower",
  },
  SUMMONER: {
    TANK: "Spirit Guard",
    ASSASSIN: "Soul Reap",
    MAGE: "Eldritch Bolt",
    SUPPORT: "Life Drain",
    BRUISER: "Summon Strike",
  },
  GIGUS: {
    TANK: "Titan Block",
    ASSASSIN: "Giga Strike",
    MAGE: "Cosmic Ray",
    SUPPORT: "Giga Heal",
    BRUISER: "Mega Punch",
  },
};

const DEFAULT_ABILITY_NAMES: Record<UnitClass, string> = {
  TANK: "Shield Bash",
  ASSASSIN: "Shadow Strike",
  MAGE: "Energy Blast",
  SUPPORT: "Healing Light",
  BRUISER: "Power Strike",
};

/**
 * Get a thematic ability name for a card based on faction + class.
 */
export function getAbilityName(card: CardDisplay): string {
  // If the card already has a special ability name from the API, use it
  if (card.specialAbility && card.specialAbility !== "NONE" && card.specialAbility.length > 2) {
    return card.specialAbility;
  }
  const unitClass = deriveUnitClass(card);
  const faction = card.faction?.toUpperCase() || "NONE";
  return FACTION_ABILITY_NAMES[faction]?.[unitClass] || DEFAULT_ABILITY_NAMES[unitClass];
}
