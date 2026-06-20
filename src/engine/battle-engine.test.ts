import { describe, expect, it } from "vitest";
import type { Card } from "@prisma/client";
import { BattleEngine } from "./battle-engine";
import { computeDamage } from "./damage-calculator";
import { predictWinRate } from "./win-predictor";

// Minimal Card factory - only the fields the engine reads need to be real.
function makeCard(id: string, overrides: Partial<Card> = {}): Card {
  return {
    id,
    giglingId: id,
    name: `Card-${id}`,
    rarity: "EPIC",
    faction: "NONE",
    attack: 70,
    defense: 60,
    speed: 65,
    health: 80,
    luck: 10,
    ovr: 75,
    rawTraits: [],
    ...overrides,
  } as Card;
}

const team = (prefix: string, o: Partial<Card> = {}) => [
  makeCard(`${prefix}1`, o),
  makeCard(`${prefix}2`, o),
  makeCard(`${prefix}3`, o),
];

describe("computeDamage (plan §4.4)", () => {
  const rng = () => 0.99; // never crits
  it("applies the DEF/(DEF+100) reduction formula", () => {
    // ATK 82, DEF 74 -> raw 82, reduction 0.425 -> 47
    const { damage } = computeDamage({ attack: 82, defense: 74, luck: 0, rng });
    expect(damage).toBe(Math.floor(82 * (1 - 74 / 174)));
  });
  it("applies attack bonus and special multiplier", () => {
    const { damage } = computeDamage({ attack: 100, attackBonusPct: 50, defense: 0, luck: 0, multiplier: 2, rng });
    expect(damage).toBe(300); // 100 * 1.5 * 2, no reduction
  });
  it("crits for 1.5x when the roll is low", () => {
    const base = computeDamage({ attack: 100, defense: 0, luck: 0, rng: () => 0.99 }).damage;
    const crit = computeDamage({ attack: 100, defense: 0, luck: 100, rng: () => 0 });
    expect(crit.isCritical).toBe(true);
    expect(crit.damage).toBe(Math.floor(base * 1.5));
  });
});

describe("BattleEngine", () => {
  it("always resolves within the 15-turn limit with a decisive result", () => {
    for (let s = 0; s < 30; s++) {
      const state = new BattleEngine(team("P"), team("A")).simulateBattle();
      expect(["WIN", "LOSS", "DRAW"]).toContain(state.result);
      expect(state.turn).toBeLessThanOrEqual(15);
    }
  });

  it("is deterministic - identical inputs produce identical battles", () => {
    const a = new BattleEngine(team("P"), team("A")).simulateBattle();
    const b = new BattleEngine(team("P"), team("A")).simulateBattle();
    expect(a.result).toBe(b.result);
    expect(a.turn).toBe(b.turn);
    expect(a.logs.length).toBe(b.logs.length);
    expect(a.playerDamageDealt).toBe(b.playerDamageDealt);
  });

  it("deals real damage, tracks an MVP, and reports per-side damage", () => {
    const state = new BattleEngine(team("P"), team("A")).simulateBattle();
    const dmgLogs = state.logs.filter((l) => typeof l.damage === "number" && l.damage! > 0);
    expect(dmgLogs.length).toBeGreaterThan(0);
    expect(dmgLogs.every((l) => !Number.isNaN(l.damage) && l.actorName)).toBe(true);
    expect(state.playerDamageDealt).toBeGreaterThan(0);
    expect(state.mvp).not.toBeNull();
  });

  it("a much stronger team beats a much weaker one", () => {
    const strong = team("S", { attack: 99, defense: 99, speed: 99, health: 99, ovr: 99, rarity: "GIGA" });
    const weak = team("W", { attack: 40, defense: 40, speed: 40, health: 40, ovr: 40, rarity: "COMMON" });
    expect(new BattleEngine(strong, weak).simulateBattle().result).toBe("WIN");
  });
});

describe("predictWinRate", () => {
  it("scales with team power and clamps to 5-95", () => {
    const weak = predictWinRate([
      { ovr: 40, faction: "NONE" },
      { ovr: 40, faction: "NONE" },
      { ovr: 40, faction: "NONE" },
    ]);
    const strong = predictWinRate([
      { ovr: 99, faction: "CRUSADER" },
      { ovr: 99, faction: "CRUSADER" },
      { ovr: 99, faction: "CRUSADER" },
    ]);
    expect(weak.winRate).toBeGreaterThanOrEqual(5);
    expect(strong.winRate).toBeLessThanOrEqual(95);
    expect(strong.winRate).toBeGreaterThan(weak.winRate);
  });
});
