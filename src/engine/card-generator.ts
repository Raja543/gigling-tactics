import {
  CARD_STAT_MIN,
  CARD_STAT_MAX,
  PERFORMANCE_NORMALIZATION,
  PERFORMANCE_WEIGHTS,
  OVR_TRAIT_WEIGHT,
  OVR_PERFORMANCE_WEIGHT,
  DETERMINISTIC_VARIANCE,
} from './balance';
import { getPassiveAbility, getSpecialAbility } from './trait-mapper';
import crypto from 'crypto';

export interface GiglingPetData {
  petId: number;
  rarity: number;
  rarityName: string;
  faction: number;
  factionName: string;
  gender: 'Male' | 'Female';
  ownerAddress: string;
  racesRun: number;
  wins: number;
  elo: number;
  maxRaces: number;
  revealsPerStat: { start: number; speed: number; stamina: number; finish: number };
  startRange: { min: number; max: number };
  speedRange: { min: number; max: number };
  staminaRange: { min: number; max: number };
  finishRange: { min: number; max: number };
  traits: Array<{ id: string; name: string; tier: number | null }>;
}

export interface GeneratedCard {
  giglingId: string;
  name: string;
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'RELIC' | 'GIGA';
  faction: 'NONE' | 'CRUSADER' | 'OVERSEER' | 'ATHENA' | 'ARCHON' | 'FOXGLOVE' | 'SUMMONER' | 'CHOBO' | 'GIGUS';
  attack: number;
  defense: number;
  speed: number;
  health: number;
  ovr: number;
  luck: number;
  traitScore: number;
  performanceScore: number;
  rarityScore: number;
  passiveAbility: string;
  specialAbility: string;
  totalRaces: number;
  totalWins: number;
  winRatePct: number;
  elo: number;
  rawTraits: any;
  rawRaceData: any;
}

export function deterministicHash(petId: number, salt: string): number {
  const hash = crypto.createHash('sha256')
    .update(`${petId}-${DETERMINISTIC_VARIANCE.saltVersion}-${salt}`)
    .digest('hex');
  // Use first 8 characters of hex, convert to int, then modulo 101 to get 0-100
  return parseInt(hash.substring(0, 8), 16) % 101;
}

function clampStat(value: number): number {
  return Math.max(CARD_STAT_MIN, Math.min(CARD_STAT_MAX, Math.floor(value)));
}

// normalize(value,min,max) -> 0..1 (plan §2.3)
function normalize(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

// Midpoint of a revealed stat range (plan §2.4 ESTIMATED_STAT).
const est = (r: { min: number; max: number }) => (r.min + r.max) / 2;

// NFT rarity tier -> base trait weight (plan §2.2).
// Base trait weight per rarity NAME (plan §2.2), spread cleanly across all
// seven tiers so each rarity has an explicit, name-aligned floor.
const RARITY_WEIGHT: Record<GeneratedCard['rarity'], number> = {
  COMMON: 15,
  UNCOMMON: 30,
  RARE: 45,
  EPIC: 60,
  LEGENDARY: 75,
  RELIC: 88,
  GIGA: 100,
};

// Per-trait tier bonus used by the Trait Score (plan §2.2).
const traitTierBonus = (tier: number | null | undefined) =>
  tier === 1 ? 3 : tier === 2 ? 5 : tier === 3 ? 8 : 1;

// 0-100 contribution from stat-relevant traits (plan §2.4 *_trait_bonus).
function statTraitBonus(
  traits: Array<{ id?: string; tier?: number | null }>,
  ids: string[],
): number {
  let sum = 0;
  for (const t of traits) {
    if (ids.includes((t.id || '').toLowerCase())) {
      sum += t.tier === 1 ? 40 : t.tier === 2 ? 60 : t.tier === 3 ? 80 : 20;
    }
  }
  return Math.min(100, sum);
}

// Performance Score 0-100 (plan §2.3, skill-weighted). Weights sum to 100.
export function calculatePerformanceScore(
  winRateFrac: number,
  elo: number,
  wins: number,
  races: number,
): number {
  const { elo: e, wins: w, races: r } = PERFORMANCE_NORMALIZATION;
  const W = PERFORMANCE_WEIGHTS;
  return Math.round(
    normalize(winRateFrac, 0, 1) * W.winRate +
      normalize(elo, e.min, e.max) * W.elo +
      normalize(wins, w.min, w.max) * W.wins +
      normalize(races, r.min, r.max) * W.races,
  );
}

// Map the Gigaverse API rarity tier (1-6) onto our enum. Verified against the
// live API: tier 1 = Uncommon, tier 2 = Rare (no "Common" among racers).
// API rarity tier -> enum. Tier 0 (unhatched / "Unknown") is treated as Common,
// completing the 7-rarity ladder: Common, Uncommon, Rare, Epic, Legendary,
// Relic, Giga.
const RARITY_BY_ID: Record<number, GeneratedCard['rarity']> = {
  0: 'COMMON',
  1: 'UNCOMMON',
  2: 'RARE',
  3: 'EPIC',
  4: 'LEGENDARY',
  5: 'RELIC',
  6: 'GIGA',
};

const RARITY_NAMES: readonly GeneratedCard['rarity'][] = [
  'COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'RELIC', 'GIGA',
];

// Faction id (0-8) -> enum. Id 3 is Athena (the plan listed it as unused).
const FACTION_BY_ID: Record<number, GeneratedCard['faction']> = {
  0: 'NONE',
  1: 'CRUSADER',
  2: 'OVERSEER',
  3: 'ATHENA',
  4: 'ARCHON',
  5: 'FOXGLOVE',
  6: 'SUMMONER',
  7: 'CHOBO',
  8: 'GIGUS',
};

function mapRarity(rarity: number, rarityName: string): GeneratedCard['rarity'] {
  // Prefer the API's authoritative rarity name; fall back to the tier index.
  const upper = rarityName?.toUpperCase() as GeneratedCard['rarity'];
  if (RARITY_NAMES.includes(upper)) return upper;
  return RARITY_BY_ID[rarity] ?? 'COMMON';
}

function mapFaction(faction: number, factionName: string): GeneratedCard['faction'] {
  if (FACTION_BY_ID[faction] !== undefined) return FACTION_BY_ID[faction];
  const upper = factionName?.toUpperCase() as GeneratedCard['faction'];
  return Object.values(FACTION_BY_ID).includes(upper) ? upper : 'NONE';
}

export function generateCard(petData: GiglingPetData): GeneratedCard {
  const { petId, rarity, rarityName, faction, factionName, racesRun, wins, elo, traits, finishRange, staminaRange, speedRange, startRange, revealsPerStat } = petData;

  const winRateFrac = racesRun > 0 ? wins / racesRun : 0;
  const winRatePct = Math.round(winRateFrac * 100);

  const mappedRarity = mapRarity(rarity, rarityName);

  // §2.2 Trait Score = rarity weight + normalized trait-tier bonus (0-15).
  const rarityWeight = RARITY_WEIGHT[mappedRarity];
  const tierSum = traits.reduce((s, t) => s + traitTierBonus(t.tier), 0);
  const maxTierBonus = Math.max(1, traits.length) * 8;
  const traitTierComponent = (tierSum / maxTierBonus) * 15;
  const traitScore = Math.min(100, Math.round(rarityWeight + traitTierComponent));

  // §2.3 Performance Score.
  const performanceScore = calculatePerformanceScore(winRateFrac, elo, wins, racesRun);

  // OVR composite (0-100) then mapped linearly onto the 40-99 display band, so
  // the full range is used instead of everyone piling on the 40 floor. Skill
  // (performance) is weighted above rarity (trait).
  const composite = traitScore * OVR_TRAIT_WEIGHT + performanceScore * OVR_PERFORMANCE_WEIGHT;
  const ovr = Math.max(
    CARD_STAT_MIN,
    Math.min(CARD_STAT_MAX, Math.round(CARD_STAT_MIN + (composite / 100) * (CARD_STAT_MAX - CARD_STAT_MIN))),
  );

  // §2.4 Individual stats. Components are all on a 0-100 scale; weights sum to 1.
  const racesRunNorm = normalize(racesRun, 0, PERFORMANCE_NORMALIZATION.races.max) * 100;
  const totalReveals = Object.values(revealsPerStat).reduce((a, b) => a + b, 0);
  const totalRevealsNorm = (totalReveals / 40) * 100;

  const attack = clampStat(
    est(finishRange) * 0.35 +
      winRatePct * 0.3 +
      statTraitBonus(traits, ['clutch', 'surger', 'volatile']) * 0.25 +
      deterministicHash(petId, 'attack') * 0.1,
  );
  const defense = clampStat(
    est(staminaRange) * 0.4 +
      racesRunNorm * 0.25 +
      statTraitBonus(traits, ['steady', 'faction-heart']) * 0.25 +
      deterministicHash(petId, 'defense') * 0.1,
  );
  const speed = clampStat(
    est(speedRange) * 0.4 +
      est(startRange) * 0.25 +
      statTraitBonus(traits, ['fast-start', 'closer']) * 0.25 +
      deterministicHash(petId, 'speed') * 0.1,
  );
  const health = clampStat(
    est(staminaRange) * 0.3 +
      totalRevealsNorm * 0.25 +
      racesRunNorm * 0.25 +
      statTraitBonus(traits, ['comeback']) * 0.15 +
      deterministicHash(petId, 'health') * 0.05,
  );

  // §2.6 Luck (hidden stat, 1-20) used for crit chance.
  const luck = (deterministicHash(petId, 'luck') % 20) + 1;

  const rarityScore = rarityWeight;

  const passive = getPassiveAbility(traits);
  const special = getSpecialAbility(traits);

  return {
    giglingId: petId.toString(),
    name: `#${petId}`,
    rarity: mappedRarity,
    faction: mapFaction(faction, factionName),
    attack,
    defense,
    speed,
    health,
    ovr,
    luck,
    traitScore,
    performanceScore,
    rarityScore,
    passiveAbility: passive.abilityName,
    specialAbility: special.abilityName,
    totalRaces: racesRun,
    totalWins: wins,
    winRatePct,
    elo,
    rawTraits: traits,
    rawRaceData: {
      revealsPerStat, startRange, speedRange, staminaRange, finishRange
    }
  };
}
