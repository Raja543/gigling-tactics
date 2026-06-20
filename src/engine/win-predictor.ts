import type { Faction } from "@prisma/client";
import { calculateSynergies } from "./synergy-calculator";

export interface WinPrediction {
  winRate: number; // 0-100, vs an average opponent
  teamPower: number; // sum of OVR
  avgOvr: number;
  synergyNames: string[];
}

interface PredictInput {
  ovr: number;
  faction: Faction | string;
  attack?: number;
  defense?: number;
  speed?: number;
  health?: number;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Estimate a team's win rate against an "average" opponent (~OVR 65), factoring
 * in raw power and active faction synergies. Deterministic - no RNG.
 */
export function predictWinRate(cards: PredictInput[]): WinPrediction {
  if (cards.length === 0) {
    return { winRate: 0, teamPower: 0, avgOvr: 0, synergyNames: [] };
  }

  const teamPower = cards.reduce((sum, c) => sum + (c.ovr || 0), 0);
  const avgOvr = teamPower / cards.length;

  // Each point of average OVR above/below the 65 baseline shifts win rate ~1.4%.
  const base = 50 + (avgOvr - 65) * 1.4;

  const synergies = calculateSynergies(cards.map((c) => c.faction as Faction));
  // Average synergy stat boost translates into roughly +0.4% win rate per point.
  const synergyPower = synergies.reduce((sum, s) => {
    const boosts = Object.values(s.statBoosts);
    const avgBoost = boosts.reduce((a, b) => a + b, 0) / Math.max(1, boosts.length);
    return sum + avgBoost;
  }, 0);
  const synergyBonus = Math.min(15, synergyPower * 0.4);

  const winRate = Math.round(clamp(base + synergyBonus, 5, 95));

  return {
    winRate,
    teamPower,
    avgOvr: Math.round(avgOvr),
    synergyNames: synergies.map((s) => s.name),
  };
}
