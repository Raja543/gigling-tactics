import { describe, expect, it } from "vitest";
import { calculateRank, PLACEMENT_MATCHES_REQUIRED } from "./ranking";

describe("calculateRank", () => {
  it("is in placement until enough battles are played", () => {
    const r = calculateRank(1500, PLACEMENT_MATCHES_REQUIRED - 1);
    expect(r.isPlacing).toBe(true);
    expect(r.tier).toBe("UNRANKED");
  });

  it("ranks once placements are complete", () => {
    const r = calculateRank(1500, PLACEMENT_MATCHES_REQUIRED);
    expect(r.isPlacing).toBe(false);
    expect(r.tier).not.toBe("UNRANKED");
  });

  it("maps ELO onto the correct tier boundaries", () => {
    expect(calculateRank(900, 10).tier).toBe("IRON");
    expect(calculateRank(1000, 10).tier).toBe("BRONZE");
    expect(calculateRank(1300, 10).tier).toBe("SILVER");
    expect(calculateRank(1600, 10).tier).toBe("GOLD");
    expect(calculateRank(2200, 10).tier).toBe("DIAMOND");
    expect(calculateRank(3100, 10).tier).toBe("RADIANT");
  });

  it("higher ELO never produces a lower tier", () => {
    const order = ["IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND", "ASCENDANT", "IMMORTAL", "RADIANT"];
    let prev = -1;
    for (const elo of [900, 1100, 1400, 1700, 2000, 2300, 2600, 2900, 3200]) {
      const idx = order.indexOf(calculateRank(elo, 10).tier);
      expect(idx).toBeGreaterThanOrEqual(prev);
      prev = idx;
    }
  });
});
