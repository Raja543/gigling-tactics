import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { generateCard, type GeneratedCard } from '@/engine/card-generator';
import {
  fetchAllLeaderboard,
  fetchPetsChunked,
  leaderboardEntryToPetData,
  petToPetData,
  type RacingPet,
} from './gigaverse-api';
import { Rarity, Faction, Prisma } from '@prisma/client';

export interface SyncResult {
  cardsAdded: number;
  cardsUpdated: number;
  errors: string[];
}

/** Card column values (everything except identity: id / userId / giglingId). */
function buildCardData(generated: GeneratedCard, imageUrl?: string | null) {
  return {
    name: generated.name,
    imageUrl: imageUrl ?? undefined,
    rarity: generated.rarity as Rarity,
    faction: generated.faction as Faction,
    attack: generated.attack,
    defense: generated.defense,
    speed: generated.speed,
    health: generated.health,
    ovr: generated.ovr,
    luck: generated.luck,
    passiveAbility: generated.passiveAbility,
    specialAbility: generated.specialAbility,
    traitScore: generated.traitScore,
    performanceScore: generated.performanceScore,
    totalRaces: generated.totalRaces,
    totalWins: generated.totalWins,
    winRatePct: generated.winRatePct,
    elo: generated.elo,
    rarityScore: generated.rarityScore,
    rawTraits: generated.rawTraits as Prisma.InputJsonValue,
    rawRaceData: generated.rawRaceData as Prisma.InputJsonValue,
  };
}

function traitRows(rawTraits: unknown, cardId: string) {
  if (!Array.isArray(rawTraits)) return [];
  return (rawTraits as Array<{ id?: string; name?: string; tier?: number | null }>).map((t) => ({
    cardId,
    traitType: t.name || 'Unknown',
    traitValue: t.id || 'Unknown',
    rarityPercentage: 0,
    rarityTier: String(t.tier || '1'),
    weight: (t.tier || 1) * 5,
  }));
}

async function batchCreate<T>(
  rows: T[],
  size: number,
  fn: (chunk: T[]) => Promise<unknown>,
) {
  for (let i = 0; i < rows.length; i += size) {
    await fn(rows.slice(i, i + size));
  }
}

/**
 * Ensure a user row exists for a wallet address (used by the on-chain import
 * flow and SIWE auth).
 */
export async function ensureUser(walletAddress: string, username?: string | null) {
  const addr = walletAddress.trim().toLowerCase();
  return db.user.upsert({
    where: { walletAddress: addr },
    update: username ? { username } : {},
    create: { walletAddress: addr, username: username ?? null },
  });
}

/**
 * Upsert a single generated card (+ traits) for a user. Used by the per-wallet
 * import flow where volume is small.
 */
export async function upsertGeneratedCard(
  userId: string,
  generated: GeneratedCard,
  extra?: { imageUrl?: string | null },
): Promise<'added' | 'updated'> {
  const existingCard = await db.card.findUnique({
    where: { userId_giglingId: { userId, giglingId: generated.giglingId } },
    select: { id: true },
  });

  const cardData = buildCardData(generated, extra?.imageUrl);
  const upsertedCard = await db.card.upsert({
    where: { userId_giglingId: { userId, giglingId: generated.giglingId } },
    update: cardData,
    create: { userId, giglingId: generated.giglingId, ...cardData },
  });

  await db.cardTrait.deleteMany({ where: { cardId: upsertedCard.id } });
  const rows = traitRows(generated.rawTraits, upsertedCard.id);
  if (rows.length) await db.cardTrait.createMany({ data: rows });

  return existingCard ? 'updated' : 'added';
}

/**
 * Sync EVERY Gigling that has raced (the full leaderboard, thousands of pets)
 * into cards with real on-chain art. Uses bulk inserts so the whole population
 * loads in ~tens of queries instead of tens of thousands.
 */
export async function syncLeaderboardCards(): Promise<SyncResult> {
  const result: SyncResult = { cardsAdded: 0, cardsUpdated: 0, errors: [] };

  try {
    const leaderboard = await fetchAllLeaderboard();
    if (leaderboard.length === 0) return result;

    // Real pet records (include NFT art) for every pet, fetched in chunks.
    const pets = await fetchPetsChunked(leaderboard.map((e) => e.petId));
    const petById = new Map<number, RacingPet>(pets.map((p) => [p.id, p]));

    // 1. Ensure a user exists for every owner (bulk). Addresses are stored
    // lowercase so they never split into case-variant rows.
    const ownerOf = (e: (typeof leaderboard)[number]) => e.ownerAddress.trim().toLowerCase();
    const owners = [...new Set(leaderboard.map(ownerOf).filter(Boolean))];
    const existingUsers = await db.user.findMany({
      where: { walletAddress: { in: owners } },
      select: { id: true, walletAddress: true },
    });
    const userByAddr = new Map(existingUsers.map((u) => [u.walletAddress, u.id]));
    const newUsers = owners
      .filter((a) => !userByAddr.has(a))
      .map((a) => {
        const id = randomUUID();
        userByAddr.set(a, id);
        const entry = leaderboard.find((e) => ownerOf(e) === a);
        return { id, walletAddress: a, username: entry?.ownerSummary?.username ?? null };
      });
    await batchCreate(newUsers, 500, (chunk) =>
      db.user.createMany({ data: chunk, skipDuplicates: true }),
    );

    // 2. Map existing cards so we can tell inserts from updates.
    const existingCards = await db.card.findMany({
      select: { id: true, userId: true, giglingId: true },
    });
    const cardIdByKey = new Map(existingCards.map((c) => [`${c.userId}:${c.giglingId}`, c.id]));

    const cardCreates: Prisma.CardCreateManyInput[] = [];
    const newTraitRows: ReturnType<typeof traitRows> = [];
    const updates: { id: string; data: ReturnType<typeof buildCardData>; rawTraits: unknown }[] = [];
    const seen = new Set<string>();

    for (const entry of leaderboard) {
      try {
        const userId = userByAddr.get(ownerOf(entry));
        if (!userId) continue;
        const pet = petById.get(entry.petId);
        const petData = pet ? petToPetData(pet) : leaderboardEntryToPetData(entry);
        const generated = generateCard(petData);
        const key = `${userId}:${generated.giglingId}`;
        if (seen.has(key)) continue; // de-dupe within this run
        seen.add(key);

        const data = buildCardData(generated, pet?.imgUrl);
        const existingId = cardIdByKey.get(key);
        if (existingId) {
          updates.push({ id: existingId, data, rawTraits: generated.rawTraits });
          result.cardsUpdated++;
        } else {
          const id = randomUUID();
          cardCreates.push({ id, userId, giglingId: generated.giglingId, ...data });
          newTraitRows.push(...traitRows(generated.rawTraits, id));
          result.cardsAdded++;
        }
      } catch (err) {
        result.errors.push(
          `Failed pet ${entry.petId}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    // 3. Bulk insert new cards + their traits.
    await batchCreate(cardCreates, 500, (chunk) =>
      db.card.createMany({ data: chunk, skipDuplicates: true }),
    );
    await batchCreate(newTraitRows, 1000, (chunk) =>
      db.cardTrait.createMany({ data: chunk, skipDuplicates: true }),
    );

    // 4. Refresh stats on pre-existing cards (traits are derived from the NFT
    // and effectively stable, so we don't rewrite them here - much faster).
    // Run updates with bounded concurrency.
    const CONCURRENCY = 25;
    for (let i = 0; i < updates.length; i += CONCURRENCY) {
      await Promise.all(
        updates
          .slice(i, i + CONCURRENCY)
          .map((u) => db.card.update({ where: { id: u.id }, data: u.data })),
      );
    }
  } catch (error) {
    result.errors.push(
      `Leaderboard sync failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return result;
}

const RARITY_NUM: Record<string, number> = { COMMON: 0, UNCOMMON: 1, RARE: 2, EPIC: 3, LEGENDARY: 4, RELIC: 5, GIGA: 6 };
const FACTION_NUM: Record<string, number> = { NONE: 0, CRUSADER: 1, OVERSEER: 2, ATHENA: 3, ARCHON: 4, FOXGLOVE: 5, SUMMONER: 6, CHOBO: 7, GIGUS: 8 };

type StoredCard = {
  id: string; giglingId: string; rarity: string; faction: string;
  totalRaces: number; totalWins: number; elo: number;
  rawTraits: unknown; rawRaceData: unknown;
};

// Rebuild a GiglingPetData purely from columns we already store on a card, so
// stats can be regenerated without re-fetching from the API.
function cardToPetData(card: StoredCard) {
  const rd = (card.rawRaceData ?? {}) as Record<string, { min: number; max: number } | Record<string, number>>;
  const range = (k: string) => (rd[k] as { min: number; max: number }) ?? { min: 40, max: 40 };
  return {
    petId: Number(card.giglingId),
    rarity: RARITY_NUM[card.rarity] ?? 1,
    rarityName: card.rarity,
    faction: FACTION_NUM[card.faction] ?? 0,
    factionName: card.faction,
    gender: 'Male' as const,
    ownerAddress: '',
    racesRun: card.totalRaces,
    wins: card.totalWins,
    elo: card.elo,
    maxRaces: 60,
    revealsPerStat: (rd.revealsPerStat as { start: number; speed: number; stamina: number; finish: number }) ?? { start: 0, speed: 0, stamina: 0, finish: 0 },
    startRange: range('startRange'),
    speedRange: range('speedRange'),
    staminaRange: range('staminaRange'),
    finishRange: range('finishRange'),
    traits: Array.isArray(card.rawTraits) ? (card.rawTraits as Array<{ id: string; name: string; tier: number | null }>) : [],
  };
}

/**
 * Recompute stats from stored data for any card the live leaderboard sync did
 * not cover (e.g. pets that dropped off the leaderboard). Luck > 20 is the
 * marker of the legacy formula. Self-heals so every card uses the §2 formula.
 */
export async function regenerateStaleCards(): Promise<{ regenerated: number }> {
  // Stale markers: legacy luck (>20) or a rarity the current mapping never
  // produces ("COMMON"). These cards dropped off the leaderboard so the live
  // sync didn't touch them.
  const stale = (await db.card.findMany({
    where: { OR: [{ luck: { gt: 20 } }, { rarity: 'COMMON' }] },
    select: { id: true, giglingId: true, rarity: true, faction: true, totalRaces: true, totalWins: true, elo: true, rawTraits: true, rawRaceData: true },
  })) as StoredCard[];
  if (stale.length === 0) return { regenerated: 0 };

  // Re-fetch from the API where possible so rarity/faction are authoritative.
  const ids = stale.map((c) => Number(c.giglingId)).filter((n) => !Number.isNaN(n));
  const pets = await fetchPetsChunked(ids);
  const petById = new Map<number, RacingPet>(pets.map((p) => [p.id, p]));

  const CONCURRENCY = 25;
  for (let i = 0; i < stale.length; i += CONCURRENCY) {
    await Promise.all(
      stale.slice(i, i + CONCURRENCY).map((card) => {
        const pet = petById.get(Number(card.giglingId));
        const g = generateCard(pet ? petToPetData(pet) : cardToPetData(card));
        return db.card.update({
          where: { id: card.id },
          data: {
            rarity: g.rarity as Rarity, faction: g.faction as Faction,
            imageUrl: pet?.imgUrl ?? undefined,
            attack: g.attack, defense: g.defense, speed: g.speed, health: g.health,
            ovr: g.ovr, luck: g.luck, traitScore: g.traitScore,
            performanceScore: g.performanceScore, rarityScore: g.rarityScore,
          },
        });
      }),
    );
  }
  return { regenerated: stale.length };
}

/**
 * Backfill real NFT art for any cards still missing an image.
 */
export async function backfillCardImages(): Promise<{ updated: number; missing: number }> {
  const cards = await db.card.findMany({
    where: { imageUrl: null },
    select: { id: true, giglingId: true },
  });
  if (cards.length === 0) return { updated: 0, missing: 0 };

  const ids = cards.map((c) => Number(c.giglingId)).filter((n) => !Number.isNaN(n));
  const pets = await fetchPetsChunked(ids);
  const imgById = new Map<number, string>(pets.map((p) => [p.id, p.imgUrl]));

  let updated = 0;
  let missing = 0;
  for (const card of cards) {
    const img = imgById.get(Number(card.giglingId));
    if (img) {
      await db.card.update({ where: { id: card.id }, data: { imageUrl: img } });
      updated++;
    } else {
      missing++;
    }
  }
  return { updated, missing };
}
