-- Align the ArenaTier enum in the DB with the schema (init only had
-- BRONZE/SILVER/GOLD/LEGEND). Postgres requires one ADD VALUE per statement,
-- and they cannot run inside a transaction block, so each is standalone.
ALTER TYPE "ArenaTier" ADD VALUE IF NOT EXISTS 'UNRANKED';
ALTER TYPE "ArenaTier" ADD VALUE IF NOT EXISTS 'IRON';
ALTER TYPE "ArenaTier" ADD VALUE IF NOT EXISTS 'PLATINUM';
ALTER TYPE "ArenaTier" ADD VALUE IF NOT EXISTS 'DIAMOND';
ALTER TYPE "ArenaTier" ADD VALUE IF NOT EXISTS 'ASCENDANT';
ALTER TYPE "ArenaTier" ADD VALUE IF NOT EXISTS 'IMMORTAL';
ALTER TYPE "ArenaTier" ADD VALUE IF NOT EXISTS 'RADIANT';
