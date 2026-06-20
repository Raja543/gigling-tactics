-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('COMMON', 'UNCOMMON', 'EPIC', 'LEGENDARY', 'RELIC', 'GIGA');

-- CreateEnum
CREATE TYPE "Faction" AS ENUM ('NONE', 'CRUSADER', 'OVERSEER', 'ARCHON', 'FOXGLOVE', 'SUMMONER', 'CHOBO', 'GIGUS');

-- CreateEnum
CREATE TYPE "ArenaTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'LEGEND');

-- CreateEnum
CREATE TYPE "BattleResult" AS ENUM ('WIN', 'LOSS', 'DRAW');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('ATTACK', 'SPECIAL', 'PASSIVE', 'DEFEATED', 'HEAL', 'STATUS');

-- CreateEnum
CREATE TYPE "CardRole" AS ENUM ('FRONTLINE', 'DPS', 'SUPPORT');

-- CreateEnum
CREATE TYPE "AchievementTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "username" TEXT,
    "collection_score" INTEGER NOT NULL DEFAULT 0,
    "battles_won" INTEGER NOT NULL DEFAULT 0,
    "battles_lost" INTEGER NOT NULL DEFAULT 0,
    "total_battles" INTEGER NOT NULL DEFAULT 0,
    "elo_rating" INTEGER NOT NULL DEFAULT 1000,
    "favorite_gigling_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cards" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "gigling_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image_url" TEXT,
    "rarity" "Rarity" NOT NULL,
    "ovr" INTEGER NOT NULL,
    "attack" INTEGER NOT NULL,
    "defense" INTEGER NOT NULL,
    "speed" INTEGER NOT NULL,
    "health" INTEGER NOT NULL,
    "luck" INTEGER NOT NULL DEFAULT 10,
    "faction" "Faction" NOT NULL,
    "passive_ability" TEXT NOT NULL,
    "special_ability" TEXT NOT NULL,
    "trait_score" INTEGER NOT NULL,
    "performance_score" INTEGER NOT NULL,
    "total_races" INTEGER NOT NULL DEFAULT 0,
    "total_wins" INTEGER NOT NULL DEFAULT 0,
    "win_rate_pct" INTEGER NOT NULL DEFAULT 0,
    "elo" INTEGER NOT NULL DEFAULT 1000,
    "rarity_score" DOUBLE PRECISION NOT NULL,
    "raw_traits" JSONB,
    "raw_race_data" JSONB,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_traits" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "trait_type" TEXT NOT NULL,
    "trait_value" TEXT NOT NULL,
    "rarity_percentage" DOUBLE PRECISION NOT NULL,
    "rarity_tier" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,

    CONSTRAINT "card_traits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My Team',
    "team_power" INTEGER NOT NULL DEFAULT 0,
    "synergy_type" TEXT,
    "predicted_win_rate" DOUBLE PRECISION,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deck_cards" (
    "id" TEXT NOT NULL,
    "deck_id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "slot_position" INTEGER NOT NULL,
    "role" "CardRole" NOT NULL DEFAULT 'DPS',

    CONSTRAINT "deck_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "battles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "deck_id" TEXT NOT NULL,
    "arena_tier" "ArenaTier" NOT NULL,
    "result" "BattleResult" NOT NULL,
    "turns" INTEGER NOT NULL,
    "player_damage_dealt" INTEGER NOT NULL DEFAULT 0,
    "player_damage_taken" INTEGER NOT NULL DEFAULT 0,
    "elo_change" INTEGER NOT NULL DEFAULT 0,
    "mvp_card_id" TEXT,
    "ai_team" JSONB NOT NULL,
    "battle_summary" JSONB,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "battles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "battle_logs" (
    "id" TEXT NOT NULL,
    "battle_id" TEXT NOT NULL,
    "turn_number" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,
    "actor_name" TEXT NOT NULL,
    "action_type" "ActionType" NOT NULL,
    "target_name" TEXT,
    "damage" INTEGER,
    "is_critical" BOOLEAN NOT NULL DEFAULT false,
    "healing" INTEGER,
    "status_effect" TEXT,
    "message" TEXT NOT NULL,

    CONSTRAINT "battle_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "achievement_key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "tier" "AchievementTier" NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_sync_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "cards_updated" INTEGER NOT NULL DEFAULT 0,
    "cards_added" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'success',
    "error_message" TEXT,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_wallet_address_key" ON "users"("wallet_address");

-- CreateIndex
CREATE INDEX "cards_rarity_idx" ON "cards"("rarity");

-- CreateIndex
CREATE INDEX "cards_ovr_idx" ON "cards"("ovr");

-- CreateIndex
CREATE INDEX "cards_faction_idx" ON "cards"("faction");

-- CreateIndex
CREATE UNIQUE INDEX "cards_user_id_gigling_id_key" ON "cards"("user_id", "gigling_id");

-- CreateIndex
CREATE UNIQUE INDEX "deck_cards_deck_id_slot_position_key" ON "deck_cards"("deck_id", "slot_position");

-- CreateIndex
CREATE UNIQUE INDEX "deck_cards_deck_id_card_id_key" ON "deck_cards"("deck_id", "card_id");

-- CreateIndex
CREATE INDEX "battles_user_id_idx" ON "battles"("user_id");

-- CreateIndex
CREATE INDEX "battles_result_idx" ON "battles"("result");

-- CreateIndex
CREATE INDEX "battle_logs_battle_id_turn_number_idx" ON "battle_logs"("battle_id", "turn_number");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_user_id_achievement_key_key" ON "achievements"("user_id", "achievement_key");

-- CreateIndex
CREATE INDEX "card_sync_logs_user_id_synced_at_idx" ON "card_sync_logs"("user_id", "synced_at");

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_traits" ADD CONSTRAINT "card_traits_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decks" ADD CONSTRAINT "decks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deck_cards" ADD CONSTRAINT "deck_cards_deck_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deck_cards" ADD CONSTRAINT "deck_cards_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battles" ADD CONSTRAINT "battles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battles" ADD CONSTRAINT "battles_deck_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "decks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battle_logs" ADD CONSTRAINT "battle_logs_battle_id_fkey" FOREIGN KEY ("battle_id") REFERENCES "battles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_sync_logs" ADD CONSTRAINT "card_sync_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
