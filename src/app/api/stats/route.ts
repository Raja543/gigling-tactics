import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Cached site-wide stats for the landing banner. Counts are cheap and change
// slowly, so revalidate every 5 minutes.
export const revalidate = 300;

export async function GET() {
  try {
    const [cards, players, battles] = await Promise.all([
      db.card.count(),
      db.user.count(),
      db.battle.count(),
    ]);

    return NextResponse.json(
      {
        success: true,
        stats: {
          cards,
          players,
          battles,
          factions: 7,
        },
      },
      { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" } },
    );
  } catch (error) {
    console.error("[stats] GET failed:", error);
    return NextResponse.json({ success: false, error: "Failed to load stats." }, { status: 500 });
  }
}
