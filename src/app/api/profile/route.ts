import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { normalizeAddress } from "@/lib/utils";
import { ACHIEVEMENTS } from "@/engine/achievements";

const MAX_USERNAME_LEN = 24;

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
    console.error("[profile] GET failed:", error);
    return NextResponse.json({ success: false, error: "Failed to load profile." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { walletAddress: raw, username, favoriteGiglingId } = body;
    if (typeof raw !== "string" || !raw.trim()) {
      return NextResponse.json({ success: false, error: "wallet required" }, { status: 400 });
    }
    const walletAddress = normalizeAddress(raw);

    // Only the authenticated owner may edit their profile. The SIWE session
    // cookie holds the verified address; it must match the target wallet.
    const session = (await cookies()).get("siwe-session")?.value;
    if (!session || normalizeAddress(session) !== walletAddress) {
      return NextResponse.json({ success: false, error: "Not authorized to edit this profile." }, { status: 401 });
    }

    const user = await db.user.update({
      where: { walletAddress },
      data: {
        // Cap username length; allow clearing with an empty string.
        ...(username !== undefined && { username: String(username).slice(0, MAX_USERNAME_LEN).trim() || null }),
        ...(favoriteGiglingId !== undefined && { favoriteGiglingId }),
      },
    });
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("[profile] PUT failed:", error);
    return NextResponse.json({ success: false, error: "Failed to update profile." }, { status: 500 });
  }
}
