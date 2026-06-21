import { describe, expect, it } from "vitest";
import type { Faction } from "@prisma/client";
import { calculateSynergies, applySynergyBoosts } from "./synergy-calculator";

const f = (...xs: string[]) => xs as Faction[];

describe("calculateSynergies", () => {
  it("Faction Unity: all 3 same faction", () => {
    const s = calculateSynergies(f("CRUSADER", "CRUSADER", "CRUSADER"));
    expect(s.map((x) => x.name)).toContain("Faction Unity");
  });

  it("Battle Brothers: 2 same + 1 different", () => {
    const s = calculateSynergies(f("ARCHON", "ARCHON", "CHOBO"));
    expect(s.map((x) => x.name)).toContain("Battle Brothers");
    expect(s.map((x) => x.name)).not.toContain("Faction Unity");
  });

  it("Full Diversity: all 3 different", () => {
    const s = calculateSynergies(f("ARCHON", "CHOBO", "GIGUS"));
    expect(s.map((x) => x.name)).toContain("Full Diversity");
  });

  it("named combo: Nature's Guard (Foxglove + Chobo + Gigus)", () => {
    const s = calculateSynergies(f("FOXGLOVE", "CHOBO", "GIGUS"));
    expect(s.map((x) => x.name)).toContain("Nature's Guard");
  });

  it("ignores NONE factions for unity", () => {
    const s = calculateSynergies(f("NONE", "NONE", "NONE"));
    expect(s.map((x) => x.name)).not.toContain("Faction Unity");
  });
});

describe("applySynergyBoosts", () => {
  it("adds the percentage boost on top of base stats", () => {
    const base = { attack: 100, defense: 100, speed: 100, health: 100 };
    const boosted = applySynergyBoosts(base, [
      { name: "x", description: "", statBoosts: { attack: 20, defense: 0, speed: 0, health: 0 } },
    ]);
    expect(boosted.attack).toBe(120);
    expect(boosted.defense).toBe(100);
  });

  it("does not mutate the input stats", () => {
    const base = { attack: 100, defense: 100, speed: 100, health: 100 };
    applySynergyBoosts(base, [{ name: "x", description: "", statBoosts: { attack: 50, defense: 0, speed: 0, health: 0 } }]);
    expect(base.attack).toBe(100);
  });
});
