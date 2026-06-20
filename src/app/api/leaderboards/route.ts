import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const revalidate = 60;

export async function GET() {
  try {
    const playerSelect = {
      username: true,
      walletAddress: true,
      collectionScore: true,
      eloRating: true,
      battlesWon: true,
      battlesLost: true,
      totalBattles: true,
      _count: { select: { cards: true } },
    } as const;

    const [cards, players, arenaPlayers] = await Promise.all([
      db.card.findMany({
        orderBy: { elo: 'desc' },
        take: 50,
        include: { user: { select: { username: true, walletAddress: true } } },
      }),
      db.user.findMany({
        orderBy: [{ collectionScore: 'desc' }, { eloRating: 'desc' }],
        take: 50,
        select: playerSelect,
      }),
      // Arena ranking: only players who have actually battled, by battle ELO.
      db.user.findMany({
        where: { totalBattles: { gt: 0 } },
        orderBy: [{ eloRating: 'desc' }, { battlesWon: 'desc' }],
        take: 50,
        select: playerSelect,
      }),
    ]);

    const mapPlayer = (p: typeof players[number]) => ({
      username: p.username,
      walletAddress: p.walletAddress,
      collectionScore: p.collectionScore,
      eloRating: p.eloRating,
      battlesWon: p.battlesWon,
      battlesLost: p.battlesLost,
      totalBattles: p.totalBattles,
      cardCount: p._count.cards,
    });

    return NextResponse.json({
      success: true,
      cards,
      players: players.map(mapPlayer),
      arenaPlayers: arenaPlayers.map(mapPlayer),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
