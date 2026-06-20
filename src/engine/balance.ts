export const CARD_STAT_MIN = 40;
export const CARD_STAT_MAX = 99;
export const BATTLE_TURN_LIMIT = 15;
export const BATTLE_HEALTH_MULTIPLIER = 4;

// Calibrated to the real racing population (not aspirational caps) so that
// win rate / wins / races actually move the score instead of flat-lining.
export const PERFORMANCE_NORMALIZATION = {
  elo: { min: 1100, max: 1950 },
  wins: { min: 0, max: 40 },
  races: { min: 0, max: 50 },
} as const;

// Performance weights (sum to 100). Skill-first: win rate + wins dominate;
// ELO is de-emphasized because nearly every pet sits near the ~1500 default.
export const PERFORMANCE_WEIGHTS = {
  winRate: 40,
  wins: 25,
  elo: 20,
  races: 15,
} as const;

// OVR = trait*0.4 + performance*0.6 (skill-leaning), then mapped onto 40-99.
export const OVR_TRAIT_WEIGHT = 0.4;
export const OVR_PERFORMANCE_WEIGHT = 0.6;

export const DETERMINISTIC_VARIANCE = {
  min: 0,
  max: 100,
  saltVersion: "v1",
} as const;

export const BALANCE_POLICY = {
  cardRarityPromotionEnabled: false,
  rarityAlwaysMatchesNft: true,
} as const;
