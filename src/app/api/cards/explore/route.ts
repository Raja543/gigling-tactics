import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Faction, Prisma, Rarity } from '@prisma/client';

const VALID_FACTIONS = new Set<string>(Object.values(Faction));
const VALID_RARITIES = new Set<string>(Object.values(Rarity));
const MAX_SEARCH_LEN = 64;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // Validate enum inputs against an allowlist; ignore anything unrecognised so a
  // bad value can't trip a Prisma validation error (and leak internals).
  const factionParam = searchParams.get('faction');
  const faction = factionParam && VALID_FACTIONS.has(factionParam) ? factionParam : null;
  const rarityParam = searchParams.get('rarity');
  const rarity = rarityParam && VALID_RARITIES.has(rarityParam) ? rarityParam : null;
  // Cap the search string to keep ILIKE scans bounded.
  const search = (searchParams.get('search') || '').slice(0, MAX_SEARCH_LEN).trim() || null;
  const owner = searchParams.get('owner');
  const sort = searchParams.get('sort') || 'ovr_desc';
  // Hard page ceiling bounds the OFFSET so an out-of-range page can't force an
  // expensive deep scan (population is < ~5k cards, i.e. ~100 pages at 48/page).
  const page = Math.min(2000, Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '48', 10) || 48));
  const wantStats = searchParams.get('stats') === '1';
  // The total only changes on sync, so the client fetches it once (page 1 /
  // filter change) and passes it back via &count=N to skip the COUNT(*) on
  // subsequent page navigations.
  const knownTotal = parseInt(searchParams.get('count') || '', 10);
  const hasKnownTotal = Number.isFinite(knownTotal) && knownTotal >= 0;

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
    // the join for much faster, lighter responses. Count + page run in parallel;
    // the COUNT(*) is skipped when the client already knows the total.
    const [total, cards] = await Promise.all([
      hasKnownTotal && !wantStats ? Promise.resolve(knownTotal) : db.card.count({ where }),
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

    return NextResponse.json(
      {
        success: true,
        cards: mappedCards,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        stats,
      },
      {
        // Public catalog is near-static between syncs, so let the CDN serve
        // repeat/paginated views instantly. Owner-scoped (personalized) queries
        // must stay fresh + private — caching them would show stale collections
        // right after an import.
        headers: {
          'Cache-Control': owner
            ? 'private, no-store'
            : 's-maxage=60, stale-while-revalidate=300',
        },
      },
    );
  } catch (error) {
    // Log full detail server-side; return a generic message to the client.
    console.error('[cards/explore] query failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to load cards.' }, { status: 500 });
  }
}
