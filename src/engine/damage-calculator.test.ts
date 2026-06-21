import { describe, expect, it } from "vitest";
import { computeDamage, calculateHealing } from "./damage-calculator";

const noCrit = () => 0.99; // above any crit threshold
const alwaysCrit = () => 0; // below any crit threshold

describe("computeDamage", () => {
  it("applies DEF/(DEF+100) mitigation", () => {
    // raw 100, DEF 100 -> reduction 0.5 -> floor(50) = 50
    expect(computeDamage({ attack: 100, defense: 100, luck: 0, rng: noCrit }).damage).toBe(50);
    // raw 100, DEF 0 -> no reduction -> 100
    expect(computeDamage({ attack: 100, defense: 0, luck: 0, rng: noCrit }).damage).toBe(100);
  });

  it("never deals less than 1 damage", () => {
    expect(computeDamage({ attack: 1, defense: 9999, luck: 0, rng: noCrit }).damage).toBe(1);
  });

  it("multiplies for specials and attack bonuses", () => {
    const base = computeDamage({ attack: 100, defense: 0, luck: 0, rng: noCrit }).damage;
    const special = computeDamage({ attack: 100, defense: 0, luck: 0, multiplier: 2, rng: noCrit }).damage;
    const bonus = computeDamage({ attack: 100, defense: 0, luck: 0, attackBonusPct: 50, rng: noCrit }).damage;
    expect(special).toBe(base * 2);
    expect(bonus).toBe(150);
  });

  it("crits for ~1.5x when the roll succeeds", () => {
    const normal = computeDamage({ attack: 100, defense: 0, luck: 0, rng: noCrit });
    const crit = computeDamage({ attack: 100, defense: 0, luck: 0, rng: alwaysCrit });
    expect(normal.isCritical).toBe(false);
    expect(crit.isCritical).toBe(true);
    expect(crit.damage).toBe(Math.floor(normal.damage * 1.5));
  });

  it("raises crit chance with luck", () => {
    // crit chance = (10 + luck/2)%. At luck 20 -> 20%. A roll of 0.15 crits only with enough luck.
    const lowLuck = computeDamage({ attack: 100, defense: 0, luck: 0, rng: () => 0.15 });
    const highLuck = computeDamage({ attack: 100, defense: 0, luck: 20, rng: () => 0.15 });
    expect(lowLuck.isCritical).toBe(false);
    expect(highLuck.isCritical).toBe(true);
  });
});

describe("calculateHealing", () => {
  it("heals a percentage of max health", () => {
    expect(calculateHealing(500, 20)).toBe(100);
    expect(calculateHealing(333, 15)).toBe(50);
  });
});
