import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { normalizeAddress } from '@/lib/utils';

const MAX_NAME_LEN = 24;

/**
 * Resolve the deck and verify the caller (identified by walletAddress) owns it.
 * Returns the deck on success, or a NextResponse error to return directly.
 * This closes the IDOR where any caller could mutate any deck by id.
 */
async function authorizeDeck(deckId: string, rawWallet: unknown) {
  if (typeof rawWallet !== 'string' || !rawWallet.trim()) {
    return { error: NextResponse.json({ success: false, error: 'walletAddress is required.' }, { status: 400 }) };
  }
  const walletAddress = normalizeAddress(rawWallet);
  const user = await db.user.findUnique({ where: { walletAddress }, select: { id: true } });
  const deck = await db.deck.findUnique({ where: { id: deckId }, select: { id: true, userId: true } });
  // Same response whether the deck is missing or owned by someone else, so we
  // don't leak which deck ids exist.
  if (!user || !deck || deck.userId !== user.id) {
    return { error: NextResponse.json({ success: false, error: 'Deck not found.' }, { status: 404 }) };
  }
  return { deck };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params;
    const body = await request.json().catch(() => ({}));
    const { name, isActive, walletAddress } = body;

    const auth = await authorizeDeck(p.id, walletAddress);
    if (auth.error) return auth.error;

    const deck = await db.deck.update({
      where: { id: p.id },
      data: {
        ...(name !== undefined && { name: String(name).slice(0, MAX_NAME_LEN) }),
        ...(isActive !== undefined && { isActive: !!isActive }),
      },
    });

    return NextResponse.json({ success: true, deck });
  } catch (error) {
    console.error('[decks/[id]] PATCH failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to update team.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params;
    // DELETE has no body in the hook, so accept the wallet via ?wallet= too.
    const body = await request.json().catch(() => ({}));
    const wallet = body?.walletAddress ?? new URL(request.url).searchParams.get('wallet');

    const auth = await authorizeDeck(p.id, wallet);
    if (auth.error) return auth.error;

    // Battles reference the deck (no cascade), so remove them first. Their logs
    // cascade automatically; deckCards cascade on deck delete.
    await db.$transaction([
      db.battle.deleteMany({ where: { deckId: p.id } }),
      db.deck.delete({ where: { id: p.id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[decks/[id]] DELETE failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete team.' }, { status: 500 });
  }
}
