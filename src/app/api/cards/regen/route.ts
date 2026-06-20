import { NextResponse } from 'next/server';
import { regenerateStaleCards } from '@/services/card-sync';

// Recompute stats (from stored data) for cards the leaderboard sync missed.
export const maxDuration = 300;

export async function GET() {
  try {
    const regen = await regenerateStaleCards();
    return NextResponse.json({ success: true, ...regen });
  } catch (error) {
    console.error("[cards/regen] regen failed:", error);
    return NextResponse.json({ success: false, error: "Regeneration failed." }, { status: 500 });
  }
}
