import { serverEnv } from "@/lib/env";
import type { GiglingPetData } from '@/engine/card-generator';

export class GigaverseApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "GigaverseApiError";
  }
}

export async function gigaverseFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(
    new URL(path.replace(/^\//, ""), `${serverEnv.GIGAVERSE_API_BASE}/`),
    {
      ...init,
      headers: {
        Accept: "application/json",
        ...init?.headers,
      },
      next: { revalidate: 300 },
    },
  );

  if (!response.ok) {
    throw new GigaverseApiError(
      `Gigaverse request failed with status ${response.status}`,
      response.status,
    );
  }

  return response.json() as Promise<T>;
}

export interface GigaverseResponse<T> {
  success: boolean;
  data?: T;
  entries?: T;
  pets?: T;
  stats?: T;
  message?: string;
}

/** Shape returned by the `/pets?ids=` endpoint. */
export interface RacingPet {
  id: number;
  ownerAddress: string;
  name: string;
  imgUrl: string;
  gender: 'Male' | 'Female';
  rarity: number;
  rarityName: string;
  faction: number;
  factionName: string;
  racePublic: {
    id: number;
    racesRun: number;
    maxRaces: number;
    revealsPerStat: { start: number; speed: number; stamina: number; finish: number };
    startRange: { min: number; max: number };
    speedRange: { min: number; max: number };
    staminaRange: { min: number; max: number };
    finishRange: { min: number; max: number };
    traits: Array<{ id: string; name: string; tier: number | null }>;
    elo: number;
    eloRaceCount: number;
    wins: number;
  };
}

export interface LeaderboardEntry {
  rank: number;
  petId: number;
  elo: number;
  eloRaceCount: number;
  racesRun: number;
  wins: number;
  rarity: number;
  faction: number;
  gender: 'Male' | 'Female';
  ownerAddress: string;
  racePublic: {
    id: number;
    racesRun: number;
    maxRaces: number;
    revealsPerStat: { start: number; speed: number; stamina: number; finish: number };
    startRange: { min: number; max: number };
    speedRange: { min: number; max: number };
    staminaRange: { min: number; max: number };
    finishRange: { min: number; max: number };
    traits: Array<{ id: string; name: string; tier: number | null }>;
    elo: number;
    eloRaceCount: number;
    wins: number;
  };
  rarityName: string;
  factionName: string;
  ownerSummary: {
    username: string;
    petCount: number;
    topRacingGigling: { petId: number; name: string; rarity: number; elo: number };
  };
}

export interface GlobalStats {
  totalRacesCreated: number;
  totalEntries: number;
  uniqueRacers: number;
  racesByPhase: Record<string, number>;
}

export async function fetchPets(ids: number[]): Promise<RacingPet[]> {
  if (ids.length === 0) return [];
  // The API expects a single comma-separated `ids` param.
  const res = await gigaverseFetch<GigaverseResponse<RacingPet[]>>(
    `/pets?ids=${ids.join(',')}`,
  );
  return res.pets || res.data || [];
}

// The `/pets` endpoint returns at most 50 pets per request, so fetch in chunks.
const PETS_CHUNK_SIZE = 40;

export async function fetchPetsChunked(ids: number[]): Promise<RacingPet[]> {
  const out: RacingPet[] = [];
  for (let i = 0; i < ids.length; i += PETS_CHUNK_SIZE) {
    const chunk = ids.slice(i, i + PETS_CHUNK_SIZE);
    out.push(...(await fetchPets(chunk)));
  }
  return out;
}

export async function fetchPetStats(ids: number[]): Promise<any[]> {
  if (ids.length === 0) return [];
  const res = await gigaverseFetch<GigaverseResponse<any[]>>(
    `/pets/stats?ids=${ids.join(',')}`,
  );
  return res.stats || res.data || [];
}

export async function fetchSinglePetStats(petId: number): Promise<any> {
  const res = await gigaverseFetch<GigaverseResponse<any>>(`/pets/${petId}/stats`);
  return res.data;
}

// The leaderboard endpoint caps each request at 100 entries.
const LEADERBOARD_PAGE_SIZE = 100;

export async function fetchEloLeaderboard(
  limit = LEADERBOARD_PAGE_SIZE,
  offset = 0,
): Promise<LeaderboardEntry[]> {
  const res = await gigaverseFetch<GigaverseResponse<LeaderboardEntry[]>>(
    `/leaderboard/elo?limit=${limit}&offset=${offset}`,
  );
  return res.entries || [];
}

/**
 * Fetch every Gigling that has raced (the full ELO leaderboard), paging until
 * the API runs out of entries. `maxPages` is a safety cap (~6000 pets).
 */
export async function fetchAllLeaderboard(maxPages = 60): Promise<LeaderboardEntry[]> {
  const all: LeaderboardEntry[] = [];
  for (let page = 0; page < maxPages; page++) {
    const batch = await fetchEloLeaderboard(LEADERBOARD_PAGE_SIZE, page * LEADERBOARD_PAGE_SIZE);
    all.push(...batch);
    if (batch.length < LEADERBOARD_PAGE_SIZE) break;
  }
  return all;
}

export async function fetchWalletRaces(wallet: string): Promise<any[]> {
  const res = await gigaverseFetch<GigaverseResponse<any[]>>(`/races/${wallet}`);
  return res.data || [];
}

export async function fetchGlobalStats(): Promise<GlobalStats | null> {
  const res = await gigaverseFetch<GigaverseResponse<GlobalStats>>(`/stats`);
  return res.data || null;
}

export function petToPetData(pet: RacingPet): GiglingPetData {
  const rp = pet.racePublic;
  return {
    petId: pet.id,
    rarity: pet.rarity,
    rarityName: pet.rarityName,
    faction: pet.faction,
    factionName: pet.factionName,
    gender: pet.gender,
    ownerAddress: pet.ownerAddress,
    racesRun: rp.racesRun,
    wins: rp.wins,
    elo: rp.elo,
    maxRaces: rp.maxRaces,
    revealsPerStat: rp.revealsPerStat,
    startRange: rp.startRange,
    speedRange: rp.speedRange,
    staminaRange: rp.staminaRange,
    finishRange: rp.finishRange,
    traits: rp.traits,
  };
}

export function leaderboardEntryToPetData(entry: LeaderboardEntry): GiglingPetData {
  return {
    petId: entry.petId,
    rarity: entry.rarity,
    rarityName: entry.rarityName,
    faction: entry.faction,
    factionName: entry.factionName,
    gender: entry.gender,
    ownerAddress: entry.ownerAddress,
    racesRun: entry.racesRun,
    wins: entry.wins,
    elo: entry.elo,
    maxRaces: entry.racePublic.maxRaces,
    revealsPerStat: entry.racePublic.revealsPerStat,
    startRange: entry.racePublic.startRange,
    speedRange: entry.racePublic.speedRange,
    staminaRange: entry.racePublic.staminaRange,
    finishRange: entry.racePublic.finishRange,
    traits: entry.racePublic.traits,
  };
}
