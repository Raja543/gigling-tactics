export type CompetitiveTier = 
  | "UNRANKED"
  | "IRON"
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM"
  | "DIAMOND"
  | "ASCENDANT"
  | "IMMORTAL"
  | "RADIANT";

export interface RankInfo {
  tier: CompetitiveTier;
  subTier?: number;
  label: string;
  color: string;
  progress: number; // 0-100 for tier progress
  placementMatchesPlayed: number;
  isPlacing: boolean;
}

export const PLACEMENT_MATCHES_REQUIRED = 3;

/**
 * Calculates a player's competitive rank based on their Elo rating and total battles played.
 */
export function calculateRank(elo: number, totalBattles: number): RankInfo {
  if (totalBattles < PLACEMENT_MATCHES_REQUIRED) {
    return {
      tier: "UNRANKED",
      label: "Unranked",
      color: "#94a3b8",
      progress: 0,
      placementMatchesPlayed: totalBattles,
      isPlacing: true,
    };
  }

  // ELO Boundaries
  // Starting Elo is 1000.
  let tier: CompetitiveTier = "IRON";
  let label = "Iron";
  let color = "#78716c";
  let min = 0;
  let max = 1000;

  if (elo >= 3100) {
    tier = "RADIANT"; label = "Radiant"; color = "#fef08a"; min = 3100; max = 3400;
  } else if (elo >= 2800) {
    tier = "IMMORTAL"; label = "Immortal"; color = "#f43f5e"; min = 2800; max = 3100;
  } else if (elo >= 2500) {
    tier = "ASCENDANT"; label = "Ascendant"; color = "#10b981"; min = 2500; max = 2800;
  } else if (elo >= 2200) {
    tier = "DIAMOND"; label = "Diamond"; color = "#c084fc"; min = 2200; max = 2500;
  } else if (elo >= 1900) {
    tier = "PLATINUM"; label = "Platinum"; color = "#2dd4bf"; min = 1900; max = 2200;
  } else if (elo >= 1600) {
    tier = "GOLD"; label = "Gold"; color = "#fbbf24"; min = 1600; max = 1900;
  } else if (elo >= 1300) {
    tier = "SILVER"; label = "Silver"; color = "#e2e8f0"; min = 1300; max = 1600;
  } else if (elo >= 1000) {
    tier = "BRONZE"; label = "Bronze"; color = "#b45309"; min = 1000; max = 1300;
  } else {
    tier = "IRON"; label = "Iron"; color = "#78716c"; min = 0; max = 1000;
  }

  let progress = 0;
  let subTier = 1;

  if (tier === "RADIANT") {
    progress = 100;
    subTier = 1;
  } else if (tier === "IRON") {
    progress = Math.max(0, Math.min(100, (elo / 1000) * 100));
    if (progress >= 66.6) {
      subTier = 3;
    } else if (progress >= 33.3) {
      subTier = 2;
    } else {
      subTier = 1;
    }
  } else {
    const tierPoints = elo - min;
    subTier = Math.min(3, Math.floor(tierPoints / 100) + 1);
    progress = tierPoints % 100;
  }

  return {
    tier,
    subTier,
    label: tier === "RADIANT" ? "Radiant" : `${label} ${subTier}`,
    color,
    progress,
    placementMatchesPlayed: totalBattles,
    isPlacing: false,
  };
}
