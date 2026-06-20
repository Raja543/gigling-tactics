// Visual identity for rarities and factions.
//
// Rarity colors are sampled directly from the uploaded rarity icon sprite
// (public/rarities/*). Faction colors + logos come from the uploaded faction
// sigils (public/<faction>.png).

export type RarityKey =
  | "COMMON"
  | "UNCOMMON"
  | "RARE"
  | "EPIC"
  | "LEGENDARY"
  | "RELIC"
  | "GIGA";

export type FactionKey =
  | "NONE"
  | "CRUSADER"
  | "OVERSEER"
  | "ATHENA"
  | "ARCHON"
  | "FOXGLOVE"
  | "SUMMONER"
  | "CHOBO"
  | "GIGUS";

export interface RarityStyle {
  /** Primary color (gem fill). */
  base: string;
  /** Brighter highlight color (used for glow / gradient end). */
  glow: string;
  /** Sliced icon from the uploaded sprite. */
  icon: string;
}

// Colors sampled directly from the rarity icon sprite (public/rarity-icons.png).
export const RARITY_STYLES: Record<RarityKey, RarityStyle> = {
  COMMON: { base: "#9BABB2", glow: "#C7DCD0", icon: "/rarities/common.png" },
  UNCOMMON: { base: "#1EBC73", glow: "#50FF93", icon: "/rarities/uncommon.png" },
  RARE: { base: "#02C6D7", glow: "#67DDE7", icon: "/rarities/rare.png" },
  EPIC: { base: "#DE38E1", glow: "#EB88ED", icon: "/rarities/epic.png" },
  LEGENDARY: { base: "#F79617", glow: "#FAC074", icon: "/rarities/legendary.png" },
  RELIC: { base: "#F04F78", glow: "#F695AE", icon: "/rarities/relic.png" },
  // Giga is a multi-color gradient drawn from the icon palette.
  GIGA: { base: "#F79617", glow: "#DE38E1", icon: "/rarities/giga.png" },
};

export interface FactionStyle {
  color: string;
  /** Uploaded faction sigil, if one exists. */
  logo?: string;
}

export const FACTION_STYLES: Record<FactionKey, FactionStyle> = {
  NONE: { color: "#888888" },
  CRUSADER: { color: "#C32454", logo: "/crusader.png" },
  OVERSEER: { color: "#EA4F36", logo: "/overseer.png" },
  ATHENA: { color: "#9027CD", logo: "/athena.png" },
  ARCHON: { color: "#0183AC", logo: "/archon.png" },
  FOXGLOVE: { color: "#239063", logo: "/foxglove.png" },
  SUMMONER: { color: "#F79617", logo: "/summoner.png" },
  CHOBO: { color: "#E8B84B", logo: "/chobo.png" },
  GIGUS: { color: "#50FF93", logo: "/gigus.png" },
};

export function rarityStyle(rarity: string): RarityStyle {
  return RARITY_STYLES[rarity?.toUpperCase() as RarityKey] ?? RARITY_STYLES.COMMON;
}

export function factionStyle(faction: string): FactionStyle {
  return FACTION_STYLES[faction?.toUpperCase() as FactionKey] ?? FACTION_STYLES.NONE;
}
