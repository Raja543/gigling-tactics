import { Faction } from '@prisma/client';

export interface Synergy {
  name: string;
  description: string;
  statBoosts: Record<string, number>;
}

export interface CardStats {
  attack: number;
  defense: number;
  speed: number;
  health: number;
}

export function calculateSynergies(factions: Faction[]): Synergy[] {
  const synergies: Synergy[] = [];
  const counts: Partial<Record<Faction, number>> = {};
  
  factions.forEach(f => {
    if (f !== 'NONE') {
      counts[f] = (counts[f] || 0) + 1;
    }
  });

  const uniqueFactions = Object.keys(counts).length;
  
  // Faction Unity: All 3 same faction -> +20% primary stat
  if (factions.length === 3 && factions[0] === factions[1] && factions[1] === factions[2] && factions[0] !== 'NONE') {
    synergies.push({
      name: 'Faction Unity',
      description: 'All 3 same faction -> +20% primary stat',
      statBoosts: getPrimaryStatBoost(factions[0], 20)
    });
  } 
  // Battle Brothers: 2 same + 1 different -> +10% primary stat
  else if (Object.values(counts).includes(2)) {
    const dominant = (Object.keys(counts) as Faction[]).find(k => counts[k] === 2);
    if (dominant) {
      synergies.push({
        name: 'Battle Brothers',
        description: '2 same + 1 different -> +10% primary stat',
        statBoosts: getPrimaryStatBoost(dominant, 10)
      });
    }
  } 
  // Full Diversity: All 3 different -> +8% all stats
  else if (factions.length === 3 && uniqueFactions === 3 && !factions.includes('NONE')) {
    synergies.push({
      name: 'Full Diversity',
      description: 'All 3 different -> +8% all stats',
      statBoosts: { attack: 8, defense: 8, speed: 8, health: 8 }
    });
  }

  // Specific combos
  // War Council: Crusader + Overseer + Archon -> +20% team ATK
  if (counts.CRUSADER && counts.OVERSEER && counts.ARCHON) {
    synergies.push({
      name: 'War Council',
      description: 'Crusader + Overseer + Archon -> +20% team ATK',
      statBoosts: { attack: 20, defense: 0, speed: 0, health: 0 }
    });
  }

  // Nature's Guard: Foxglove + Chobo + Gigus -> +15% DEF, +10% HP
  if (counts.FOXGLOVE && counts.CHOBO && counts.GIGUS) {
    synergies.push({
      name: "Nature's Guard",
      description: "Foxglove + Chobo + Gigus -> +15% DEF, +10% HP",
      statBoosts: { attack: 0, defense: 15, speed: 0, health: 10 }
    });
  }

  // Mystic Alliance: Summoner + Foxglove + any -> +15% Crit, +10% all
  if (counts.SUMMONER && counts.FOXGLOVE) {
    synergies.push({
      name: 'Mystic Alliance',
      description: 'Summoner + Foxglove + any -> +15% Crit, +10% all',
      statBoosts: { attack: 10, defense: 10, speed: 10, health: 10 } // Critical boost handled separately in battle engine
    });
  }

  return synergies;
}

function getPrimaryStatBoost(faction: Faction, value: number): Record<string, number> {
  const boosts = { attack: 0, defense: 0, speed: 0, health: 0 };
  switch (faction) {
    case 'CRUSADER': boosts.attack = value; break;
    case 'OVERSEER': boosts.speed = value; break;
    case 'ATHENA': boosts.attack = value; boosts.defense = value; break;
    case 'ARCHON': boosts.attack = value; boosts.defense = value; break;
    case 'FOXGLOVE': boosts.speed = value; boosts.health = value; break;
    case 'SUMMONER': boosts.health = value; break;
    case 'CHOBO': boosts.attack = value; boosts.speed = value; break;
    case 'GIGUS': boosts.defense = value; boosts.health = value; break;
  }
  return boosts;
}

export function applySynergyBoosts(baseStats: CardStats, synergies: Synergy[]): CardStats {
  const finalStats = { ...baseStats };
  for (const s of synergies) {
    finalStats.attack += Math.floor(baseStats.attack * ((s.statBoosts.attack || 0) / 100));
    finalStats.defense += Math.floor(baseStats.defense * ((s.statBoosts.defense || 0) / 100));
    finalStats.speed += Math.floor(baseStats.speed * ((s.statBoosts.speed || 0) / 100));
    finalStats.health += Math.floor(baseStats.health * ((s.statBoosts.health || 0) / 100));
  }
  return finalStats;
}
