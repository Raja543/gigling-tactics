import { db } from "@/lib/db";

// Points each rarity contributes to a collection score (escalates with tier).
const RARITY_POINTS: Record<string, number> = {
  COMMON: 1,
  UNCOMMON: 2,
  RARE: 4,
  EPIC: 8,
  LEGENDARY: 16,
  RELIC: 32,
  GIGA: 64,
};

/** Per-card collection points: rarity weight + a slice of its OVR. */
export function cardScore(rarity: string, ovr: number): number {
  return (RARITY_POINTS[rarity] ?? 1) + Math.round(ovr / 5);
}

export function collectionScoreForCards(cards: { rarity: string; ovr: number }[]): number {
  return cards.reduce((sum, c) => sum + cardScore(c.rarity, c.ovr), 0);
}

/** Recompute and persist a single user's collection score. */
export async function recalcUserCollectionScore(userId: string): Promise<number> {
  const cards = await db.card.findMany({ where: { userId }, select: { rarity: true, ovr: true } });
  const score = collectionScoreForCards(cards);
  await db.user.update({ where: { id: userId }, data: { collectionScore: score } });
  return score;
}

/** Recompute collection scores for every user (used by the daily sync). */
export async function recalcAllCollectionScores(): Promise<number> {
  const cards = await db.card.findMany({ select: { userId: true, rarity: true, ovr: true } });
  const totals: Record<string, number> = {};
  for (const c of cards) totals[c.userId] = (totals[c.userId] ?? 0) + cardScore(c.rarity, c.ovr);
  const entries = Object.entries(totals);
  const CONCURRENCY = 30;
  for (let i = 0; i < entries.length; i += CONCURRENCY) {
    await Promise.all(
      entries.slice(i, i + CONCURRENCY).map(([userId, collectionScore]) =>
        db.user.update({ where: { id: userId }, data: { collectionScore } }),
      ),
    );
  }
  return entries.length;
}
