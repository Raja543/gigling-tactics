import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params;
    const body = await request.json();
    const { name, isActive } = body;

    const deck = await db.deck.update({
      where: { id: p.id },
      data: {
        ...(name !== undefined && { name }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return NextResponse.json({ success: true, deck });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params;
    // Battles reference the deck (no cascade), so remove them first. Their logs
    // cascade automatically; deckCards cascade on deck delete.
    await db.$transaction([
      db.battle.deleteMany({ where: { deckId: p.id } }),
      db.deck.delete({ where: { id: p.id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
