import { GiglingTrait } from '@/types/gigling';

export interface BattleAbility {
  traitId: string;
  abilityName: string;
  abilityType: 'passive' | 'triggered';
  description: string;
  effect: AbilityEffect;
}

export interface AbilityEffect {
  type: 'stat_boost' | 'damage_mod' | 'heal' | 'conditional';
  stat?: 'attack' | 'defense' | 'speed' | 'health';
  value: number;
  condition?: string;
  triggerChance?: number;
}

// Maps trait name + tier to specific battle abilities
const ABILITY_MAP: Record<string, Record<number, Omit<BattleAbility, 'traitId'>>> = {
  clutch: {
    1: { abilityName: 'Last Stand I', abilityType: 'passive', description: 'When HP < 30%, Attack +30%', effect: { type: 'conditional', stat: 'attack', value: 30, condition: 'HP < 30%' } },
    2: { abilityName: 'Last Stand II', abilityType: 'passive', description: 'When HP < 30%, Attack +40%', effect: { type: 'conditional', stat: 'attack', value: 40, condition: 'HP < 30%' } },
    3: { abilityName: 'Last Stand III', abilityType: 'passive', description: 'When HP < 30%, Attack +50%', effect: { type: 'conditional', stat: 'attack', value: 50, condition: 'HP < 30%' } },
  },
  surger: {
    1: { abilityName: 'Power Surge I', abilityType: 'triggered', description: 'Every 3rd attack deals +60% damage', effect: { type: 'damage_mod', value: 60, condition: 'Every 3rd attack' } },
    2: { abilityName: 'Power Surge II', abilityType: 'triggered', description: 'Every 3rd attack deals +75% damage', effect: { type: 'damage_mod', value: 75, condition: 'Every 3rd attack' } },
    3: { abilityName: 'Power Surge III', abilityType: 'triggered', description: 'Every 3rd attack deals +100% damage', effect: { type: 'damage_mod', value: 100, condition: 'Every 3rd attack' } },
  },
  closer: {
    1: { abilityName: 'Finishing Blow I', abilityType: 'triggered', description: 'Deals +25% damage to targets < 50% HP', effect: { type: 'damage_mod', value: 25, condition: 'Target HP < 50%' } },
    2: { abilityName: 'Finishing Blow II', abilityType: 'triggered', description: 'Deals +35% damage to targets < 50% HP', effect: { type: 'damage_mod', value: 35, condition: 'Target HP < 50%' } },
    3: { abilityName: 'Finishing Blow III', abilityType: 'triggered', description: 'Deals +50% damage to targets < 50% HP', effect: { type: 'damage_mod', value: 50, condition: 'Target HP < 50%' } },
  },
  'fast-start': {
    1: { abilityName: 'First Strike I', abilityType: 'passive', description: '+25% Speed for the first 3 turns', effect: { type: 'conditional', stat: 'speed', value: 25, condition: 'First 3 turns' } },
    2: { abilityName: 'First Strike II', abilityType: 'passive', description: '+35% Speed for the first 3 turns', effect: { type: 'conditional', stat: 'speed', value: 35, condition: 'First 3 turns' } },
    3: { abilityName: 'First Strike III', abilityType: 'passive', description: '+50% Speed for the first 3 turns', effect: { type: 'conditional', stat: 'speed', value: 50, condition: 'First 3 turns' } },
  },
  comeback: {
    1: { abilityName: 'Second Wind I', abilityType: 'triggered', description: 'Heal 20% HP when dropping below 50%', effect: { type: 'heal', value: 20, condition: 'HP drops below 50%' } },
    2: { abilityName: 'Second Wind II', abilityType: 'triggered', description: 'Heal 25% HP when dropping below 50%', effect: { type: 'heal', value: 25, condition: 'HP drops below 50%' } },
    3: { abilityName: 'Second Wind III', abilityType: 'triggered', description: 'Heal 35% HP when dropping below 50%', effect: { type: 'heal', value: 35, condition: 'HP drops below 50%' } },
  },
  steady: {
    1: { abilityName: 'Iron Guard I', abilityType: 'passive', description: 'Permanent +15% Defense', effect: { type: 'stat_boost', stat: 'defense', value: 15 } },
    2: { abilityName: 'Iron Guard II', abilityType: 'passive', description: 'Permanent +20% Defense', effect: { type: 'stat_boost', stat: 'defense', value: 20 } },
    3: { abilityName: 'Iron Guard III', abilityType: 'passive', description: 'Permanent +30% Defense', effect: { type: 'stat_boost', stat: 'defense', value: 30 } },
  },
  volatile: {
    1: { abilityName: 'Wild Card I', abilityType: 'triggered', description: '25% chance for 2x damage, 8% miss', effect: { type: 'damage_mod', value: 100, triggerChance: 25, condition: 'Random' } },
    2: { abilityName: 'Wild Card II', abilityType: 'triggered', description: '30% chance for 2x damage, 6% miss', effect: { type: 'damage_mod', value: 100, triggerChance: 30, condition: 'Random' } },
    3: { abilityName: 'Wild Card III', abilityType: 'triggered', description: '40% chance for 2x damage, 5% miss', effect: { type: 'damage_mod', value: 100, triggerChance: 40, condition: 'Random' } },
  },
  'faction-heart': {
    1: { abilityName: 'Rally Cry I', abilityType: 'passive', description: 'If 2+ allies share faction, +12% all stats', effect: { type: 'conditional', value: 12, condition: '2+ same faction' } },
    2: { abilityName: 'Rally Cry II', abilityType: 'passive', description: 'If 2+ allies share faction, +15% all stats', effect: { type: 'conditional', value: 15, condition: '2+ same faction' } },
    3: { abilityName: 'Rally Cry III', abilityType: 'passive', description: 'If 2+ allies share faction, +20% all stats', effect: { type: 'conditional', value: 20, condition: '2+ same faction' } },
  }
};

const DEFAULT_PASSIVE: BattleAbility = {
  traitId: 'none',
  abilityName: 'Basic Training',
  abilityType: 'passive',
  description: 'Relies on raw stats.',
  effect: { type: 'stat_boost', value: 0 }
};

const DEFAULT_SPECIAL: BattleAbility = {
  traitId: 'none',
  abilityName: 'Heavy Strike',
  abilityType: 'triggered',
  description: 'A strong basic attack.',
  effect: { type: 'damage_mod', value: 20 }
};

export function mapTraitsToAbilities(traits: GiglingTrait[]): BattleAbility[] {
  return traits.map(t => {
    const tier = t.tier || 1;
    // t.name is expected to be one of the keys like 'clutch', 'surger', etc.
    const mapped = ABILITY_MAP[t.name.toLowerCase()];
    if (!mapped || !mapped[tier]) return null;
    return {
      traitId: t.id,
      ...mapped[tier]
    };
  }).filter((a): a is BattleAbility => a !== null);
}

export function getPassiveAbility(traits: GiglingTrait[]): BattleAbility {
  const abilities = mapTraitsToAbilities(traits).filter(a => a.abilityType === 'passive');
  // Simple heuristic: pick the first passive
  if (abilities.length > 0) return abilities[0];
  return DEFAULT_PASSIVE;
}

export function getSpecialAbility(traits: GiglingTrait[]): BattleAbility {
  const abilities = mapTraitsToAbilities(traits).filter(a => a.abilityType === 'triggered');
  // Pick the first special
  if (abilities.length > 0) return abilities[0];
  return DEFAULT_SPECIAL;
}

export function getTraitStatBonus(traits: GiglingTrait[], stat: 'attack' | 'defense' | 'speed' | 'health'): number {
  const abilities = mapTraitsToAbilities(traits);
  let bonus = 0;
  for (const ab of abilities) {
    if (ab.effect.type === 'stat_boost' && ab.effect.stat === stat) {
      bonus += ab.effect.value;
    }
  }
  return bonus;
}
