export interface CardDisplay {
  id: string;
  giglingId: string;
  name: string;
  imageUrl: string | null;
  rarity: string;
  faction: string;
  ovr: number;
  attack: number;
  defense: number;
  speed: number;
  health: number;
  luck: number;
  passiveAbility: string;
  specialAbility: string;
  traitScore: number;
  performanceScore: number;
  totalRaces: number;
  totalWins: number;
  winRatePct: number;
  elo: number;
  traits: Array<{ traitType: string; traitValue: string; tier: string }>;
  owner?: { username: string | null; walletAddress: string };
}
