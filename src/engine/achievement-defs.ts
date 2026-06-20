// Pure achievement definitions — safe to import on the client (no db / prisma).

export type AchievementTierName = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";

export interface AchievementContext {
  cardCount: number;
  gigaCount: number;
  collectionScore: number;
  battlesWon: number;
  totalBattles: number;
  lastBattle?: { result: "WIN" | "LOSS" | "DRAW"; arenaTier: string; perfect: boolean };
}

export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  icon: string;
  tier: AchievementTierName;
  earned: (ctx: AchievementContext) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: "first_card", title: "Card Collector", description: "Generate your first card", icon: "🃏", tier: "BRONZE", earned: (c) => c.cardCount >= 1 },
  { key: "ten_cards", title: "Deck Builder", description: "Own 10 cards", icon: "📚", tier: "SILVER", earned: (c) => c.cardCount >= 10 },
  { key: "giga_card", title: "Giga Hunter", description: "Own a Giga rarity card", icon: "💎", tier: "GOLD", earned: (c) => c.gigaCount >= 1 },
  { key: "collection_100", title: "Completionist", description: "Reach a collection score of 100", icon: "🏛️", tier: "DIAMOND", earned: (c) => c.collectionScore >= 100 },
  { key: "first_battle", title: "Arena Rookie", description: "Complete your first battle", icon: "⚔️", tier: "BRONZE", earned: (c) => c.totalBattles >= 1 },
  { key: "first_win", title: "First Blood", description: "Win your first battle", icon: "🩸", tier: "BRONZE", earned: (c) => c.battlesWon >= 1 },
  { key: "ten_wins", title: "Battle Hardened", description: "Win 10 battles", icon: "🛡️", tier: "SILVER", earned: (c) => c.battlesWon >= 10 },
  { key: "fifty_wins", title: "War Machine", description: "Win 50 battles", icon: "🤖", tier: "GOLD", earned: (c) => c.battlesWon >= 50 },
  { key: "perfect_win", title: "Flawless Victory", description: "Win without losing a card", icon: "✨", tier: "GOLD", earned: (c) => !!c.lastBattle?.perfect },
  { key: "legend_arena", title: "Legend Challenger", description: "Win a battle in the Legend arena", icon: "👑", tier: "PLATINUM", earned: (c) => c.lastBattle?.result === "WIN" && c.lastBattle?.arenaTier === "LEGEND" },
];

export const TIER_COLOR: Record<AchievementTierName, string> = {
  BRONZE: "#CD7F32",
  SILVER: "#C0C0C0",
  GOLD: "#FFCC00",
  PLATINUM: "#67DDE7",
  DIAMOND: "#B9F2FF",
};
