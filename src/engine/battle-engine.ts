import { Card, BattleResult, Faction } from '@prisma/client';
import { computeDamage, calculateHealing } from './damage-calculator';
import { calculateSynergies, applySynergyBoosts } from './synergy-calculator';
import { BATTLE_HEALTH_MULTIPLIER } from './balance';

export type Team = 'PLAYER' | 'AI';

export interface BattleLogEntry {
  turnNumber: number;
  actorName: string;
  actionType: 'ATTACK' | 'SPECIAL' | 'PASSIVE' | 'DEFEATED' | 'HEAL';
  targetName: string | null;
  damage: number | null;
  isCritical: boolean;
  healing: number | null;
  message: string;
}

export interface BattleState {
  turn: number;
  logs: BattleLogEntry[];
  result: BattleResult;
  playerDamageDealt: number;
  playerDamageTaken: number;
  mvp: { id: string; name: string; damageDealt: number } | null;
}

const TURN_LIMIT = 15;

// Special-ability cadence + damage multiplier by rarity (plan §3.3).
const RARITY_SPECIAL: Record<string, { every: number; mult: number }> = {
  COMMON: { every: 4, mult: 1.0 },
  UNCOMMON: { every: 4, mult: 1.2 },
  RARE: { every: 3, mult: 1.4 },
  EPIC: { every: 3, mult: 1.6 },
  LEGENDARY: { every: 2, mult: 2.0 },
  RELIC: { every: 2, mult: 2.5 },
  GIGA: { every: 2, mult: 3.0 },
};

// Trait tier scaling (plan §3.2). `null` tier uses the base value.
type Tier = number | null | undefined;
const tierVal = (tier: Tier, base: number, t1: number, t2: number, t3: number) =>
  tier === 1 ? t1 : tier === 2 ? t2 : tier === 3 ? t3 : base;

interface RawTrait { id?: string; name?: string; tier?: number | null }

function traitsOf(card: Card): RawTrait[] {
  const raw = card.rawTraits as unknown;
  return Array.isArray(raw) ? (raw as RawTrait[]) : [];
}
function findTrait(traits: RawTrait[], id: string): RawTrait | undefined {
  return traits.find((t) => (t.id || '').toLowerCase() === id);
}

// Small deterministic PRNG (mulberry32) so battles are reproducible.
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Entity {
  id: string;
  name: string;
  team: Team;
  card: Card;
  ovr: number;
  attack: number;
  defense: number;
  speed: number;
  luck: number;
  maxHealth: number;
  currentHealth: number;
  alive: boolean;
  traits: RawTrait[];
  special: { every: number; mult: number };
  actionCount: number;
  attackCount: number;
  secondWindUsed: boolean;
  damageDealt: number;
}

export class BattleEngine {
  private entities: Entity[] = [];
  private logs: BattleLogEntry[] = [];
  private turn = 1;
  private rng: () => number;
  private result: BattleResult | null = null;

  constructor(playerCards: Card[], aiCards: Card[]) {
    const seed =
      [...playerCards, ...aiCards].reduce(
        (s, c) => s + (parseInt(c.giglingId, 10) || 0),
        0,
      ) + 1;
    this.rng = makeRng(seed);
    this.entities = [
      ...this.initTeam(playerCards, 'PLAYER'),
      ...this.initTeam(aiCards, 'AI'),
    ];
  }

  private initTeam(cards: Card[], team: Team): Entity[] {
    const factions = cards.map((c) => c.faction as Faction);
    const synergies = calculateSynergies(factions);

    return cards.map((card) => {
      const traits = traitsOf(card);

      // Start from base stats, then apply team synergies.
      let { attack, defense, speed, health } = applySynergyBoosts(
        { attack: card.attack, defense: card.defense, speed: card.speed, health: card.health },
        synergies,
      );

      // Iron Guard (steady): permanent +DEF%.
      const steady = findTrait(traits, 'steady');
      if (steady) defense = Math.round(defense * (1 + tierVal(steady.tier, 10, 15, 20, 30) / 100));

      // Rally Cry (faction-heart): if 2+ allies share this card's faction, +all stats%.
      const heart = findTrait(traits, 'faction-heart');
      if (heart && card.faction !== 'NONE') {
        const sameFaction = cards.filter((c) => c.faction === card.faction).length;
        if (sameFaction >= 2) {
          const pct = tierVal(heart.tier, 10, 12, 15, 20) / 100;
          attack = Math.round(attack * (1 + pct));
          defense = Math.round(defense * (1 + pct));
          speed = Math.round(speed * (1 + pct));
          health = Math.round(health * (1 + pct));
        }
      }

      const maxHealth = health * BATTLE_HEALTH_MULTIPLIER;
      return {
        id: `${team}-${card.id}`,
        name: card.name,
        team,
        card,
        ovr: card.ovr,
        attack,
        defense,
        speed,
        luck: card.luck,
        maxHealth,
        currentHealth: maxHealth,
        alive: true,
        traits,
        special: RARITY_SPECIAL[card.rarity] ?? RARITY_SPECIAL.COMMON,
        actionCount: 0,
        attackCount: 0,
        secondWindUsed: false,
        damageDealt: 0,
      };
    });
  }

  private log(e: Omit<BattleLogEntry, 'turnNumber'>) {
    this.logs.push({ turnNumber: this.turn, ...e });
  }

  // Effective speed: base + First Strike (first 3 turns) + luck/10 (plan §4.3).
  private effectiveSpeed(e: Entity): number {
    let spd = e.speed;
    const fast = findTrait(e.traits, 'fast-start');
    if (fast && this.turn <= 3) spd *= 1 + tierVal(fast.tier, 20, 25, 35, 50) / 100;
    return spd + e.luck / 10;
  }

  private aliveEnemies(of: Entity): Entity[] {
    return this.entities.filter((x) => x.alive && x.team !== of.team);
  }

  public simulateBattle(): BattleState {
    while (!this.result && this.turn <= TURN_LIMIT) {
      this.runTurn();
    }
    if (!this.result) this.result = this.resolveDraw();
    return this.buildState();
  }

  private runTurn() {
    const alivePlayers = this.entities.filter(e => e.team === 'PLAYER' && e.alive);
    const aliveAI = this.entities.filter(e => e.team === 'AI' && e.alive);

    if (!alivePlayers.length || !aliveAI.length) {
      this.result = alivePlayers.length ? 'WIN' : aliveAI.length ? 'LOSS' : 'DRAW';
      return;
    }

    // Every living unit acts this round, fastest first. With both teams fully
    // engaged, fights resolve decisively well within the turn limit.
    const order = [...alivePlayers, ...aliveAI].sort((a, b) => {
      const sd = this.effectiveSpeed(b) - this.effectiveSpeed(a);
      if (Math.abs(sd) > 0.001) return sd;
      if (b.ovr !== a.ovr) return b.ovr - a.ovr;
      if (b.attack !== a.attack) return b.attack - a.attack;
      return this.rng() - 0.5;
    });

    for (const actor of order) {
      if (this.result) break;
      if (!actor.alive) continue; // may have fallen earlier this round

      const target = this.pickTarget(actor);
      if (!target) {
        this.result = actor.team === 'PLAYER' ? 'WIN' : 'LOSS';
        break;
      }

      this.resolveAttack(actor, target);
    }

    this.turn++;
  }

  // Focus-fire: hit the lowest-HP living enemy to secure kills (deterministic).
  private pickTarget(actor: Entity): Entity | undefined {
    const enemies = this.aliveEnemies(actor);
    if (!enemies.length) return undefined;
    return enemies.reduce((lowest, e) => (e.currentHealth < lowest.currentHealth ? e : lowest), enemies[0]);
  }

  private resolveAttack(actor: Entity, target: Entity) {
    actor.actionCount++;
    const isSpecial = actor.actionCount % actor.special.every === 0;
    let multiplier = isSpecial ? actor.special.mult : 1;
    let bonusPct = 0;

    // Last Stand (clutch): HP < 30% -> +ATK%.
    const clutch = findTrait(actor.traits, 'clutch');
    if (clutch && actor.currentHealth / actor.maxHealth < 0.3) {
      bonusPct += tierVal(clutch.tier, 25, 30, 40, 50);
    }
    // Power Surge (surger): every 3rd attack -> +dmg%.
    const surger = findTrait(actor.traits, 'surger');
    if (surger && (actor.attackCount + 1) % 3 === 0) {
      bonusPct += tierVal(surger.tier, 50, 60, 75, 100);
    }
    // Finishing Blow (closer): target < 50% HP -> +dmg%.
    const closer = findTrait(actor.traits, 'closer');
    if (closer && target.currentHealth / target.maxHealth < 0.5) {
      bonusPct += tierVal(closer.tier, 20, 25, 35, 50);
    }
    // Wild Card (volatile): chance to miss or to double.
    const volatile = findTrait(actor.traits, 'volatile');
    if (volatile) {
      const doubleChance = tierVal(volatile.tier, 20, 25, 30, 40) / 100;
      const missChance = tierVal(volatile.tier, 10, 8, 6, 5) / 100;
      const roll = this.rng();
      if (roll < missChance) {
        actor.attackCount++;
        this.log({
          actorName: actor.name,
          actionType: 'ATTACK',
          targetName: target.name,
          damage: 0,
          isCritical: false,
          healing: null,
          message: `${actor.name}'s attack missed ${target.name}!`,
        });
        return;
      }
      if (roll < missChance + doubleChance) multiplier *= 2;
    }

    actor.attackCount++;
    const { damage, isCritical } = computeDamage({
      attack: actor.attack,
      attackBonusPct: bonusPct,
      defense: target.defense,
      luck: actor.luck,
      multiplier,
      rng: this.rng,
    });

    target.currentHealth = Math.max(0, target.currentHealth - damage);
    actor.damageDealt += damage;

    this.log({
      actorName: actor.name,
      actionType: isSpecial ? 'SPECIAL' : 'ATTACK',
      targetName: target.name,
      damage,
      isCritical,
      healing: null,
      message:
        `${actor.name} ${isSpecial ? 'unleashed a special on' : 'hit'} ${target.name} ` +
        `for ${damage}${isCritical ? ' (Critical!)' : ''}`,
    });

    // Second Wind (comeback): heal once when first dropping below 50%.
    if (target.alive && target.currentHealth > 0) {
      const comeback = findTrait(target.traits, 'comeback');
      if (comeback && !target.secondWindUsed && target.currentHealth / target.maxHealth < 0.5) {
        const heal = calculateHealing(target.maxHealth, tierVal(comeback.tier, 15, 20, 25, 35));
        target.currentHealth = Math.min(target.maxHealth, target.currentHealth + heal);
        target.secondWindUsed = true;
        this.log({
          actorName: target.name,
          actionType: 'HEAL',
          targetName: target.name,
          damage: null,
          isCritical: false,
          healing: heal,
          message: `${target.name} caught a Second Wind and healed ${heal} HP!`,
        });
      }
    }

    if (target.currentHealth <= 0) {
      target.alive = false;
      this.log({
        actorName: target.name,
        actionType: 'DEFEATED',
        targetName: null,
        damage: null,
        isCritical: false,
        healing: null,
        message: `${target.name} was defeated!`,
      });
      if (this.aliveEnemies(actor).length === 0) {
        this.result = actor.team === 'PLAYER' ? 'WIN' : 'LOSS';
      }
    }
  }

  // Turn limit reached: higher total remaining HP% wins; ties go to the player.
  private resolveDraw(): BattleResult {
    const frac = (team: Team) => {
      const team_ = this.entities.filter((e) => e.team === team);
      const sum = team_.reduce((s, e) => s + e.currentHealth / e.maxHealth, 0);
      return sum / team_.length;
    };
    const p = frac('PLAYER');
    const a = frac('AI');
    if (p > a) return 'WIN';
    if (a > p) return 'LOSS';
    return 'WIN';
  }

  private buildState(): BattleState {
    let playerDamageDealt = 0;
    let playerDamageTaken = 0;
    let mvp: BattleState['mvp'] = null;
    for (const e of this.entities) {
      if (e.team === 'PLAYER') {
        playerDamageDealt += e.damageDealt;
        if (!mvp || e.damageDealt > mvp.damageDealt) {
          mvp = { id: e.card.id, name: e.name, damageDealt: e.damageDealt };
        }
      } else {
        playerDamageTaken += e.damageDealt;
      }
    }
    return {
      turn: Math.min(this.turn, TURN_LIMIT),
      logs: this.logs,
      result: this.result ?? 'DRAW',
      playerDamageDealt,
      playerDamageTaken,
      mvp,
    };
  }
}
