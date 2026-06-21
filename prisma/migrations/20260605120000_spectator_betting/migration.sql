-- Spectator prediction pools (pari-mutuel)

CREATE TYPE "SpectatorBetStatus" AS ENUM ('PENDING', 'WON', 'LOST', 'REFUNDED', 'CANCELLED');
CREATE TYPE "SpectatorBettingStatus" AS ENUM ('CLOSED', 'OPEN', 'LOCKED', 'SETTLED', 'REFUNDED');

ALTER TYPE "WalletTransactionType" ADD VALUE IF NOT EXISTS 'SPECTATOR_BET_LOCK';
ALTER TYPE "WalletTransactionType" ADD VALUE IF NOT EXISTS 'SPECTATOR_BET_PAYOUT';
ALTER TYPE "WalletTransactionType" ADD VALUE IF NOT EXISTS 'SPECTATOR_BET_REFUND';
ALTER TYPE "WalletTransactionType" ADD VALUE IF NOT EXISTS 'SPECTATOR_POOL_FEE';

ALTER TABLE "Fight" ADD COLUMN IF NOT EXISTS "spectatorBettingEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Fight" ADD COLUMN IF NOT EXISTS "spectatorBettingClosesAt" TIMESTAMP(3);
ALTER TABLE "Fight" ADD COLUMN IF NOT EXISTS "spectatorPoolFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 0.08;
ALTER TABLE "Fight" ADD COLUMN IF NOT EXISTS "spectatorPoolsSettledAt" TIMESTAMP(3);
ALTER TABLE "Fight" ADD COLUMN IF NOT EXISTS "spectatorBettingStatus" "SpectatorBettingStatus" NOT NULL DEFAULT 'CLOSED';

CREATE TABLE IF NOT EXISTS "SpectatorBet" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "fightId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "selectedFighterId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "SpectatorBetStatus" NOT NULL DEFAULT 'PENDING',
    "payoutAmount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),

    CONSTRAINT "SpectatorBet_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SpectatorBet_serverId_idx" ON "SpectatorBet"("serverId");
CREATE INDEX IF NOT EXISTS "SpectatorBet_fightId_idx" ON "SpectatorBet"("fightId");
CREATE INDEX IF NOT EXISTS "SpectatorBet_userId_idx" ON "SpectatorBet"("userId");
CREATE INDEX IF NOT EXISTS "SpectatorBet_fightId_status_idx" ON "SpectatorBet"("fightId", "status");

ALTER TABLE "SpectatorBet" ADD CONSTRAINT "SpectatorBet_fightId_fkey" FOREIGN KEY ("fightId") REFERENCES "Fight"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpectatorBet" ADD CONSTRAINT "SpectatorBet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
