import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Faction, Prisma, Rarity } from '@prisma/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const faction = searchParams.get('faction');
  const rarity = searchParams.get('rarity');
  const search = searchParams.get('search');
  const owner = searchParams.get('owner');
  const sort = searchParams.get('sort') || 'ovr_desc';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '48', 10) || 48));
  const wantStats = searchParams.get('stats') === '1';

  try {
    const where: Prisma.CardWhereInput = {};
    if (faction) where.faction = faction as Faction;
    if (rarity) where.rarity = rarity as Rarity;
    // Addresses are stored lowercase; exact match avoids duplicate user rows.
    if (owner) where.user = { walletAddress: owner.trim().toLowerCase() };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { giglingId: { equals: search } },
      ];
    }

    const orderMap: Record<string, Prisma.CardOrderByWithRelationInput> = {
      ovr_asc: { ovr: 'asc' },
      atk_desc: { attack: 'desc' },
      def_desc: { defense: 'desc' },
      spd_desc: { speed: 'desc' },
      hp_desc: { health: 'desc' },
      ovr_desc: { ovr: 'desc' },
    };
    const orderBy = orderMap[sort] ?? { ovr: 'desc' };

    // Note: no `traits` include - grid cards don't render traits, so we skip
    // the join for much faster, lighter responses.
    const [total, cards] = await Promise.all([
      db.card.count({ where }),
      db.card.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy,
        include: { user: { select: { username: true, walletAddress: true } } },
      }),
    ]);

    const mappedCards = cards.map((c) => ({ ...c, owner: c.user }));

    // Optional aggregate stats for the whole filtered set (used by Collection).
    let stats = undefined;
    if (wantStats) {
      const [agg, byRarity] = await Promise.all([
        db.card.aggregate({ where, _avg: { ovr: true }, _max: { ovr: true } }),
        db.card.groupBy({ by: ['rarity'], where, _count: { _all: true } }),
      ]);
      const rarityBreakdown: Record<string, number> = {};
      byRarity.forEach((g) => (rarityBreakdown[g.rarity] = g._count._all));
      stats = {
        total,
        avgOvr: Math.round(agg._avg.ovr ?? 0),
        topOvr: agg._max.ovr ?? 0,
        rarityBreakdown,
      };
    }

    return NextResponse.json({
      success: true,
      cards: mappedCards,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
