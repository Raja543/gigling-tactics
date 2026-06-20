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
  opts: { excludeUserId?: string; excludeCardIds?: string[]; targetOvr?: number; band?: number } = {},
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
      take: 200,
    });
  }

  // Fallback to the whole tier band if not enough cards
  if (candidates.length < 3) {
    candidates = await db.card.findMany({
      where: { ovr: { gte: minOvr, lte: maxOvr }, ...exclude },
      take: 200,
    });
  }

  // Extreme fallback
  if (candidates.length < 3) {
    candidates = await db.card.findMany({ where: exclude, take: 200 });
  }
  if (candidates.length < 3) {
    throw new Error('Not enough cards in database to generate an AI team. Sync the leaderboard first.');
  }

  // Shuffle and pick 3, preferring same-faction if possible for synergy
  const shuffled = [...candidates].sort(() => 0.5 - Math.random());
  
  // Pick the first card
  const picked: Card[] = [];
  const seen = new Set<string>();
  
  const addCard = (c: Card) => {
    if (!seen.has(c.giglingId)) {
      seen.add(c.giglingId);
      picked.push(c);
    }
  };

  for (const c of shuffled) {
    if (picked.length === 0) {
      addCard(c);
    } else if (picked.length < 3) {
      // Try to find a matching faction
      if (c.faction === picked[0].faction) {
        addCard(c);
      }
    }
  }

  // If we couldn't find 3 of the same faction, just fill the rest
  for (const c of shuffled) {
    if (picked.length >= 3) break;
    addCard(c);
  }

  const roles: CardRole[] = ['FRONTLINE', 'DPS', 'SUPPORT'];
  return picked.map((card, i) => ({ card, role: roles[i] }));
}
