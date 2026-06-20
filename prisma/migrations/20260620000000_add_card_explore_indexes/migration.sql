-- Composite + stat indexes matching the explorer's filter+sort paths.
-- CreateIndex
CREATE INDEX "cards_faction_ovr_idx" ON "cards"("faction", "ovr");

-- CreateIndex
CREATE INDEX "cards_rarity_ovr_idx" ON "cards"("rarity", "ovr");

-- CreateIndex
CREATE INDEX "cards_attack_idx" ON "cards"("attack");

-- CreateIndex
CREATE INDEX "cards_defense_idx" ON "cards"("defense");

-- CreateIndex
CREATE INDEX "cards_speed_idx" ON "cards"("speed");

-- CreateIndex
CREATE INDEX "cards_health_idx" ON "cards"("health");
