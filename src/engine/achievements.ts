import { db } from "@/lib/db";
import { AchievementTier } from "@prisma/client";
import { ACHIEVEMENTS, type AchievementContext, type AchievementDef } from "./achievement-defs";

export { ACHIEVEMENTS } from "./achievement-defs";
export type { AchievementContext, AchievementDef } from "./achievement-defs";

/**
 * Evaluate all achievements for a user and persist any newly earned ones.
 * Returns the list of newly unlocked achievement definitions.
 */
export async function unlockAchievements(
  userId: string,
  lastBattle?: AchievementContext["lastBattle"],
): Promise<AchievementDef[]> {
  const [user, cardCount, gigaCount, existing] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { battlesWon: true, totalBattles: true, collectionScore: true } }),
    db.card.count({ where: { userId } }),
    db.card.count({ where: { userId, rarity: "GIGA" } }),
    db.achievement.findMany({ where: { userId }, select: { achievementKey: true } }),
  ]);
  if (!user) return [];

  const ctx: AchievementContext = {
    cardCount,
    gigaCount,
    collectionScore: user.collectionScore,
    battlesWon: user.battlesWon,
    totalBattles: user.totalBattles,
    lastBattle,
  };

  const have = new Set(existing.map((e) => e.achievementKey));
  const newly = ACHIEVEMENTS.filter((a) => !have.has(a.key) && a.earned(ctx));
  if (newly.length === 0) return [];

  await db.achievement.createMany({
    data: newly.map((a) => ({
      userId,
      achievementKey: a.key,
      title: a.title,
      description: a.description,
      icon: a.icon,
      tier: a.tier as AchievementTier,
    })),
    skipDuplicates: true,
  });
  return newly;
}
