-- CreateEnum
CREATE TYPE "MinecraftChallengeStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'REPLACED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "minecraftUuid" TEXT;
ALTER TABLE "User" ADD COLUMN "minecraftVerifiedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_serverId_minecraftUuid_key" ON "User"("serverId", "minecraftUuid");
CREATE INDEX "User_minecraftVerifiedAt_idx" ON "User"("minecraftVerifiedAt");

-- CreateTable
CREATE TABLE "MinecraftVerificationChallenge" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "claimedUsername" TEXT NOT NULL,
    "targetWorld" TEXT NOT NULL DEFAULT 'world',
    "targetX" INTEGER NOT NULL,
    "targetZ" INTEGER NOT NULL,
    "status" "MinecraftChallengeStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "regenerationCount" INTEGER NOT NULL DEFAULT 0,
    "lastCheckedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "replacedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MinecraftVerificationChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MinecraftVerificationChallenge_serverId_userId_status_idx" ON "MinecraftVerificationChallenge"("serverId", "userId", "status");
CREATE INDEX "MinecraftVerificationChallenge_expiresAt_idx" ON "MinecraftVerificationChallenge"("expiresAt");
CREATE INDEX "MinecraftVerificationChallenge_userId_createdAt_idx" ON "MinecraftVerificationChallenge"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "MinecraftVerificationChallenge" ADD CONSTRAINT "MinecraftVerificationChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
