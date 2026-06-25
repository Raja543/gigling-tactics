import { db } from '@/lib/db';
import { ArenaTier, CardRole, Card } from '@prisma/client';

interface AIEntry {
  card: Card;
  role: CardRole;
}

/**
 * Build a balanced AI team for an arena tier. Excludes the player's own cards
 * (and their other cards) so the AI never fields a card the player owns - this
 * also keeps every combatant's name unique for the battle playback UI.
 */
export async function generateAITeam(
  tier: ArenaTier,
  opts: { excludeUserId?: string; excludeCardIds?: string[]; targetOvr?: number; band?: number; isBossMatch?: boolean } = {},
): Promise<AIEntry[]> {
  const ranges: Record<ArenaTier, [number, number]> = {
    UNRANKED: [40, 55],
    IRON: [40, 50],
    BRONZE: [40, 55],
    SILVER: [55, 70],
    GOLD: [70, 85],
    PLATINUM: [75, 90],
    DIAMOND: [80, 95],
    ASCENDANT: [85, 97],
    IMMORTAL: [88, 99],
    RADIANT: [90, 99],
    LEGEND: [85, 99],
  };
  const [minOvr, maxOvr] = ranges[tier] ?? [40, 55];
  // Matchmaking tolerance: tighter bands at higher ranks make fights fairer.
  const band = opts.band ?? 3;

  const exclude = {
    ...(opts.excludeUserId ? { userId: { not: opts.excludeUserId } } : {}),
    ...(opts.excludeCardIds?.length ? { id: { notIn: opts.excludeCardIds } } : {}),
  };

  let candidates: Card[] = [];

  // If we have a target OVR, try to find a tight band first
  if (opts.targetOvr) {
    const tightMin = Math.max(minOvr, opts.targetOvr - band);
    const tightMax = Math.min(maxOvr, opts.targetOvr + band);
    candidates = await db.card.findMany({
      where: { ovr: { gte: tightMin, lte: tightMax }, ...exclude },
      take: 60,
    });
  }

  // Fallback to the whole tier band if not enough cards
  if (candidates.length < 3) {
    candidates = await db.card.findMany({
      where: { ovr: { gte: minOvr, lte: maxOvr }, ...exclude },
      take: 60,
    });
  }

  // Extreme fallback
  if (candidates.length < 3) {
    candidates = await db.card.findMany({ where: exclude, take: 60 });
  }
  if (candidates.length < 3) {
    throw new Error('Not enough cards in database to generate an AI team. Sync the leaderboard first.');
  }

  // Combat Score for AI drafting (prioritize powerful combat traits + Boss logic)
  const traitTier = (c: Card, traitName: string) => {
    const raw = c.rawTraits as any[];
    if (!Array.isArray(raw)) return 0;
    const t = raw.find((x) => (x.id || '').toLowerCase() === traitName);
    return t ? (t.tier || 1) : 0;
  };
  
  const rarityValues: Record<string, number> = { COMMON: 1, UNCOMMON: 2, RARE: 3, EPIC: 5, LEGENDARY: 10, RELIC: 15, GIGA: 20 };

  const combatScore = (c: Card) => {
    let score = Math.random() * 10; // Base variance
    
    // Weight combat traits extremely highly
    score += traitTier(c, 'surger') * 6;
    score += traitTier(c, 'clutch') * 5;
    score += traitTier(c, 'faction-heart') * 5;
    score += traitTier(c, 'fast-start') * 4;
    score += traitTier(c, 'steady') * 4;
    score += traitTier(c, 'closer') * 3;
    score += traitTier(c, 'volatile') * 3;

    // Boss Match bias
    if (opts.isBossMatch) {
      score += (rarityValues[c.rarity] || 0) * 2; // Heavily prioritize rare cards
      score += c.ovr * 0.1; // Slight nudge toward highest OVR within the band
    }

    return score;
  };

  // Sort candidates by combat score (highest first)
  const sortedCandidates = [...candidates].sort((a, b) => combatScore(b) - combatScore(a));
  
  const picked: Card[] = [];
  const seen = new Set<string>();
  
  const addCard = (c: Card) => {
    if (!seen.has(c.giglingId)) {
      seen.add(c.giglingId);
      picked.push(c);
    }
  };

  // Pick the absolute best combat card as our anchor
  for (const c of sortedCandidates) {
    if (picked.length === 0) {
      addCard(c);
      break;
    }
  }

  const anchorFaction = picked[0].faction;

  // Strict Synergy Search: aggressively find 2 more cards of the SAME faction
  if (anchorFaction && anchorFaction !== "NONE") {
    for (const c of sortedCandidates) {
      if (picked.length >= 3) break;
      if (c.faction === anchorFaction) {
        addCard(c);
      }
    }
  }

  // If we couldn't find 3 of the same faction, just fill the rest with top combat scores
  for (const c of sortedCandidates) {
    if (picked.length >= 3) break;
    addCard(c);
  }

  const roles: CardRole[] = ['FRONTLINE', 'DPS', 'SUPPORT'];
  return picked.map((card, i) => ({ card, role: roles[i] }));
}
