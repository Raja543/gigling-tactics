import { describe, expect, it } from "vitest";
import { generateCard, calculatePerformanceScore, deterministicHash, type GiglingPetData } from "./card-generator";
import { CARD_STAT_MIN, CARD_STAT_MAX } from "./balance";

function makePet(overrides: Partial<GiglingPetData> = {}): GiglingPetData {
  return {
    petId: 101,
    rarity: 3,
    rarityName: "EPIC",
    faction: 4,
    factionName: "ARCHON",
    gender: "Male",
    ownerAddress: "0xabc",
    racesRun: 100,
    wins: 55,
    elo: 1500,
    maxRaces: 200,
    revealsPerStat: { start: 5, speed: 5, stamina: 5, finish: 5 },
    startRange: { min: 40, max: 80 },
    speedRange: { min: 40, max: 80 },
    staminaRange: { min: 40, max: 80 },
    finishRange: { min: 40, max: 80 },
    traits: [],
    ...overrides,
  };
}

describe("card-generator", () => {
  it("is deterministic — same pet yields an identical card", () => {
    const a = generateCard(makePet());
    const b = generateCard(makePet());
    expect(a).toEqual(b);
  });

  it("keeps every stat within the planned display band", () => {
    const c = generateCard(makePet());
    for (const stat of [c.attack, c.defense, c.speed, c.health, c.ovr]) {
      expect(stat).toBeGreaterThanOrEqual(CARD_STAT_MIN);
      expect(stat).toBeLessThanOrEqual(CARD_STAT_MAX);
    }
    expect(c.luck).toBeGreaterThanOrEqual(1);
    expect(c.luck).toBeLessThanOrEqual(20);
  });

  it("maps the API rarity name across all 7 tiers", () => {
    const tiers = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY", "RELIC", "GIGA"] as const;
    tiers.forEach((name, i) => {
      expect(generateCard(makePet({ rarity: i, rarityName: name })).rarity).toBe(name);
    });
  });

  it("falls back to the numeric tier when the name is unknown", () => {
    expect(generateCard(makePet({ rarity: 6, rarityName: "???" })).rarity).toBe("GIGA");
    expect(generateCard(makePet({ rarity: 0, rarityName: "" })).rarity).toBe("COMMON");
  });

  it("weights skill over rarity — a grinder Common beats a lazy Legendary", () => {
    const grinderCommon = generateCard(makePet({
      rarity: 0, rarityName: "COMMON", racesRun: 400, wins: 320, elo: 1900,
    }));
    const lazyLegendary = generateCard(makePet({
      rarity: 4, rarityName: "LEGENDARY", racesRun: 10, wins: 2, elo: 1050,
    }));
    expect(grinderCommon.ovr).toBeGreaterThan(lazyLegendary.ovr);
  });

  it("handles a zero-race pet without dividing by zero", () => {
    const c = generateCard(makePet({ racesRun: 0, wins: 0 }));
    expect(c.winRatePct).toBe(0);
    expect(Number.isFinite(c.ovr)).toBe(true);
  });
});

describe("calculatePerformanceScore", () => {
  it("returns 0 for a brand-new pet and a high score for a maxed one", () => {
    expect(calculatePerformanceScore(0, 1100, 0, 0)).toBe(0);
    const maxed = calculatePerformanceScore(1, 3000, 200, 200);
    expect(maxed).toBeGreaterThan(90);
  });

  it("rewards a higher win rate", () => {
    const low = calculatePerformanceScore(0.2, 1500, 20, 100);
    const high = calculatePerformanceScore(0.8, 1500, 20, 100);
    expect(high).toBeGreaterThan(low);
  });
});

describe("deterministicHash", () => {
  it("is stable and salt-dependent", () => {
    expect(deterministicHash(5, "attack")).toBe(deterministicHash(5, "attack"));
    expect(deterministicHash(5, "attack")).not.toBe(deterministicHash(5, "defense"));
  });
});
