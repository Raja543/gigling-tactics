import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizeAddress } from "@/lib/utils";
import { ACHIEVEMENTS } from "@/engine/achievements";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletParam = searchParams.get("wallet");
  if (!walletParam) {
    return NextResponse.json({ success: false, error: "wallet required" }, { status: 400 });
  }
  const walletAddress = normalizeAddress(walletParam);

  try {
    const user = await db.user.findUnique({
      where: { walletAddress },
      include: {
        achievements: { orderBy: { unlockedAt: "desc" } },
        battles: { orderBy: { startedAt: "desc" }, take: 8 },
        cards: { 
          orderBy: { ovr: "desc" }, 
          take: 1000 // Enough to count rarities in memory
        }
      }
    });

    if (!user) {
      return NextResponse.json({ success: true, profile: null });
    }

    const cardCount = user.cards.length;
    const topCards = user.cards.slice(0, 6).map(c => ({
      ...c,
      owner: { username: user.username, walletAddress: user.walletAddress }
    }));
    
    // Calculate rarity breakdown in memory to avoid an extra DB groupBy query
    const rarityBreakdown: Record<string, number> = {};
    user.cards.forEach((c) => {
      rarityBreakdown[c.rarity] = (rarityBreakdown[c.rarity] || 0) + 1;
    });

    const winRate = user.totalBattles > 0 ? Math.round((user.battlesWon / user.totalBattles) * 100) : 0;

    return NextResponse.json({
      success: true,
      profile: {
        walletAddress: user.walletAddress,
        username: user.username,
        collectionScore: user.collectionScore,
        eloRating: user.eloRating,
        battlesWon: user.battlesWon,
        battlesLost: user.battlesLost,
        totalBattles: user.totalBattles,
        winRate,
        cardCount,
        rarityBreakdown,
        topCards,
        achievements: user.achievements,
        totalAchievements: ACHIEVEMENTS.length,
        recentBattles: user.battles,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { walletAddress: raw, username, favoriteGiglingId } = body;
    if (!raw) return NextResponse.json({ success: false, error: "wallet required" }, { status: 400 });
    const walletAddress = normalizeAddress(raw);
    const user = await db.user.update({
      where: { walletAddress },
      data: {
        ...(username !== undefined && { username }),
        ...(favoriteGiglingId !== undefined && { favoriteGiglingId }),
      },
    });
    return NextResponse.json({ success: true, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
