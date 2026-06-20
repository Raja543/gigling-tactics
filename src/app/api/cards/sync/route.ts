import { NextResponse } from 'next/server';
import { syncLeaderboardCards, backfillCardImages, regenerateStaleCards } from '@/services/card-sync';
import { recalcAllCollectionScores } from '@/engine/collection-score';

// Full leaderboard sync covers thousands of pets - allow extra time.
export const maxDuration = 300;

/**
 * Admin gate. The sync runs a heavy, externally-dependent full-DB rewrite, so it
 * must not be anonymously triggerable. Requires a secret token (timing-safe
 * compared) supplied via the `x-admin-token` header or `?token=`.
 */
function isAuthorized(request: Request): boolean {
  const expected = process.env.ADMIN_SYNC_TOKEN;
  if (!expected) return false; // no token configured -> sync disabled
  const provided =
    request.headers.get('x-admin-token') ??
    new URL(request.url).searchParams.get('token') ??
    '';
  // Constant-time comparison to avoid leaking the token via timing.
  if (provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

async function runSync() {
  const result = await syncLeaderboardCards();
  // Ensure every card carries its real on-chain NFT art.
  const backfill = await backfillCardImages();
  // Recompute stats for any card the leaderboard sync didn't cover.
  const regen = await regenerateStaleCards();
  // Refresh every player's collection score (card stats may have changed).
  const scoredUsers = await recalcAllCollectionScores();
  return { success: true, ...result, backfill, regen, scoredUsers };
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }
  try {
    return NextResponse.json(await runSync());
  } catch (error) {
    console.error('[cards/sync] sync failed:', error);
    return NextResponse.json({ success: false, error: 'Sync failed.' }, { status: 500 });
  }
}

// Kept for backwards compatibility, but equally gated. GETs should be safe/
// idempotent, so prefer POST; this exists only so an existing admin link works.
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }
  try {
    return NextResponse.json(await runSync());
  } catch (error) {
    console.error('[cards/sync] sync failed:', error);
    return NextResponse.json({ success: false, error: 'Sync failed.' }, { status: 500 });
  }
}
