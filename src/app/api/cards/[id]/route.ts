import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params;
    const card = await db.card.findUnique({
      where: { id: p.id },
      include: {
        user: { select: { username: true, walletAddress: true } },
        traits: true
      }
    });

    if (!card) {
      return NextResponse.json({ success: false, error: 'Card not found' }, { status: 404 });
    }

    const mappedCard = {
      ...card,
      owner: card.user,
      traits: card.traits.map(t => ({
        traitType: t.traitType,
        traitValue: t.traitValue,
        tier: t.rarityTier
      }))
    };

    return NextResponse.json({ success: true, card: mappedCard });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
