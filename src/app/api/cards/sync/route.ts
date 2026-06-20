import { NextResponse } from 'next/server';
import { syncLeaderboardCards, backfillCardImages, regenerateStaleCards } from '@/services/card-sync';
import { recalcAllCollectionScores } from '@/engine/collection-score';

// Full leaderboard sync covers thousands of pets - allow extra time.
export const maxDuration = 300;

export async function GET() {
  try {
    const result = await syncLeaderboardCards();
    // Ensure every card carries its real on-chain NFT art.
    const backfill = await backfillCardImages();
    // Recompute stats for any card the leaderboard sync didn't cover.
    const regen = await regenerateStaleCards();
    // Refresh every player's collection score (card stats may have changed).
    const scoredUsers = await recalcAllCollectionScores();
    return NextResponse.json({ success: true, ...result, backfill, regen, scoredUsers });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
