import { Rarity } from '@prisma/client';

export interface PromotionCost {
  copiesRequired: number;
  currencyCost: number; // e.g., in some off-chain currency or tokens
}

export const RARITY_WEIGHTS: Record<Rarity, number> = {
  COMMON: 1,
  UNCOMMON: 2,
  RARE: 3,
  EPIC: 4,
  LEGENDARY: 8,
  RELIC: 16,
  GIGA: 32
};

export function calculatePromotionCost(currentRarity: Rarity): PromotionCost | null {
  switch (currentRarity) {
    case 'COMMON':
      return { copiesRequired: 3, currencyCost: 100 };
    case 'UNCOMMON':
      return { copiesRequired: 3, currencyCost: 300 };
    case 'RARE':
      return { copiesRequired: 4, currencyCost: 600 };
    case 'EPIC':
      return { copiesRequired: 4, currencyCost: 1000 };
    case 'LEGENDARY':
      return { copiesRequired: 5, currencyCost: 5000 };
    case 'RELIC':
      return { copiesRequired: 10, currencyCost: 25000 };
    case 'GIGA':
      return null; // Max rarity, cannot be promoted
    default:
      return null;
  }
}

export function getNextRarity(currentRarity: Rarity): Rarity | null {
  switch (currentRarity) {
    case 'COMMON': return 'UNCOMMON';
    case 'UNCOMMON': return 'RARE';
    case 'RARE': return 'EPIC';
    case 'EPIC': return 'LEGENDARY';
    case 'LEGENDARY': return 'RELIC';
    case 'RELIC': return 'GIGA';
    case 'GIGA': return null;
    default: return null;
  }
}

// Determines if a user has enough copies to promote a card
export function canPromote(currentRarity: Rarity, copiesOwned: number): boolean {
  const cost = calculatePromotionCost(currentRarity);
  if (!cost) return false;
  return copiesOwned >= cost.copiesRequired;
}
