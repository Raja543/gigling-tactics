import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { normalizeAddress } from '@/lib/utils';
import { predictWinRate } from '@/engine/win-predictor';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletParam = searchParams.get('wallet');

  if (!walletParam) {
    return NextResponse.json({ success: false, error: 'Wallet address required' }, { status: 400 });
  }
  const walletAddress = normalizeAddress(walletParam);

  try {
    const user = await db.user.findUnique({ where: { walletAddress } });
    if (!user) {
      return NextResponse.json({ success: true, decks: [] });
    }

    const decks = await db.deck.findMany({
      where: { userId: user.id },
      include: {
        deckCards: {
          include: {
            card: {
              include: { traits: true }
            }
          },
          orderBy: { slotPosition: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, decks });
  } catch (error) {
    console.error('[decks] GET failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to load teams.' }, { status: 500 });
  }
}

const MAX_NAME_LEN = 24;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { walletAddress: rawWallet, name, cardIds } = body;

    if (typeof rawWallet !== 'string' || !rawWallet.trim() || !Array.isArray(cardIds) || cardIds.length !== 3) {
      return NextResponse.json({ success: false, error: 'Invalid payload. Must provide a wallet and 3 cardIds.' }, { status: 400 });
    }
    // Reject duplicate cards in a team up front.
    if (new Set(cardIds).size !== 3) {
      return NextResponse.json({ success: false, error: 'A team must have 3 distinct cards.' }, { status: 400 });
    }
    const walletAddress = normalizeAddress(rawWallet);
    const deckName = (typeof name === 'string' && name.trim() ? name.trim() : 'My Team').slice(0, MAX_NAME_LEN);

    // 1. Get or create user
    const user = await db.user.upsert({
      where: { walletAddress },
      update: {},
      create: { walletAddress }
    });

    // Enforce a maximum of 3 saved teams per player.
    const deckCount = await db.deck.count({ where: { userId: user.id } });
    if (deckCount >= 3) {
      return NextResponse.json(
        { success: false, error: 'You can only save up to 3 teams. Delete one first.' },
        { status: 400 },
      );
    }

    // 2. Fetch the cards to verify ownership and calculate team power
    const cards = await db.card.findMany({
      where: {
        id: { in: cardIds },
        userId: user.id
      }
    });

    if (cards.length !== 3) {
      return NextResponse.json({ success: false, error: 'One or more cards not found or not owned by user.' }, { status: 400 });
    }

    const teamPower = cards.reduce((sum, card) => sum + card.ovr, 0);
    const prediction = predictWinRate(cards);

    // 3. Create the deck transaction
    const deck = await db.$transaction(async (prisma) => {
      // Create deck
      const newDeck = await prisma.deck.create({
        data: {
          userId: user.id,
          name: deckName,
          teamPower,
          synergyType: prediction.synergyNames.join(', ') || null,
          predictedWinRate: prediction.winRate,
          isActive: true
        }
      });

      // Create deck cards
      const deckCardData = cardIds.map((cardId, index) => ({
        deckId: newDeck.id,
        cardId,
        slotPosition: index,
        role: index === 0 ? 'FRONTLINE' : (index === 1 ? 'DPS' : 'SUPPORT')
      }));

      // In Prisma we can createMany but it's an array
      await prisma.deckCard.createMany({
        data: deckCardData as any
      });

      return newDeck;
    });

    return NextResponse.json({ success: true, deck });
  } catch (error) {
    console.error('[decks] POST failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to save team.' }, { status: 500 });
  }
}
