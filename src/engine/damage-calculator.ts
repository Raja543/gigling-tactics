// Damage maths for the auto-battler (plan §4.4).
//
//   RAW            = ATK * (1 + ATK_BONUS%) * specialMultiplier
//   DAMAGE_REDUCTION = DEF / (DEF + 100)
//   FINAL          = floor(RAW * (1 - DAMAGE_REDUCTION))      (min 1)
//   CRIT_CHANCE    = 10% + LUCK/2 %
//   on crit        FINAL *= 1.5

export interface CombatStats {
  attack: number;
  defense: number;
  speed: number;
  health: number;
  luck: number;
}

export interface DamageResult {
  damage: number;
  isCritical: boolean;
}

export interface DamageParams {
  attack: number;
  /** Additive % bonus to attack (passives, surge, etc.). e.g. 25 = +25%. */
  attackBonusPct?: number;
  defense: number;
  luck: number;
  /** Special-ability damage multiplier (1 = normal attack). */
  multiplier?: number;
  /** Deterministic RNG in [0,1). */
  rng: () => number;
}

export function computeDamage(p: DamageParams): DamageResult {
  const bonus = (p.attackBonusPct ?? 0) / 100;
  const mult = p.multiplier ?? 1;

  const raw = p.attack * (1 + bonus) * mult;
  const reduction = p.defense / (p.defense + 100);
  let final = Math.max(1, Math.floor(raw * (1 - reduction)));

  const critChance = (10 + p.luck / 2) / 100;
  const isCritical = p.rng() < critChance;
  if (isCritical) final = Math.floor(final * 1.5);

  return { damage: final, isCritical };
}

export function calculateHealing(maxHealth: number, pct: number): number {
  return Math.round(maxHealth * (pct / 100));
}
