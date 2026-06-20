import { describe, expect, it } from "vitest";
import {
  BALANCE_POLICY,
  BATTLE_TURN_LIMIT,
  CARD_STAT_MAX,
  CARD_STAT_MIN,
  PERFORMANCE_NORMALIZATION,
} from "./balance";

describe("MVP balance contract", () => {
  it("keeps generated stats in the planned range", () => {
    expect(CARD_STAT_MIN).toBe(40);
    expect(CARD_STAT_MAX).toBe(99);
  });

  it("uses normalization ceilings calibrated to the real population", () => {
    expect(PERFORMANCE_NORMALIZATION.wins.max).toBe(40);
    expect(PERFORMANCE_NORMALIZATION.races.max).toBe(50);
    expect(PERFORMANCE_NORMALIZATION.elo.max).toBe(1950);
    expect(BATTLE_TURN_LIMIT).toBe(15);
  });

  it("never promotes card rarity above NFT rarity", () => {
    expect(BALANCE_POLICY.rarityAlwaysMatchesNft).toBe(true);
    expect(BALANCE_POLICY.cardRarityPromotionEnabled).toBe(false);
  });
});
