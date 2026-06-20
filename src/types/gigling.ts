export type GiglingRarity =
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Epic"
  | "Legendary"
  | "Relic"
  | "Giga";

export interface GiglingTrait {
  id: string;
  name: string;
  tier: number | null;
}

export interface StatRange {
  min: number;
  max: number;
}

export interface GiglingRaceStats {
  id: number;
  racesRun: number;
  wins: number;
  elo: number;
  startRange: StatRange;
  speedRange: StatRange;
  staminaRange: StatRange;
  finishRange: StatRange;
  traits: GiglingTrait[];
}
