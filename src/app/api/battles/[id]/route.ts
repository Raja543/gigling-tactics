import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params;
    const battle = await db.battle.findUnique({
      where: { id: p.id },
      include: {
        logs: {
          orderBy: { sequence: 'asc' }
        },
        deck: {
          include: {
            deckCards: {
              include: { card: true },
              orderBy: { slotPosition: 'asc' }
            }
          }
        }
      }
    });

    if (!battle) {
      return NextResponse.json({ success: false, error: 'Battle not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, battle });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
