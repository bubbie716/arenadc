-- Multi-server: add serverId to tenant-scoped models (existing rows → dc)

-- User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "serverId" TEXT NOT NULL DEFAULT 'dc';
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_discordId_key";
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_minecraftUsername_key";
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_referralCode_key";
CREATE UNIQUE INDEX IF NOT EXISTS "User_serverId_discordId_key" ON "User"("serverId", "discordId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_serverId_minecraftUsername_key" ON "User"("serverId", "minecraftUsername");
CREATE UNIQUE INDEX IF NOT EXISTS "User_serverId_referralCode_key" ON "User"("serverId", "referralCode");
CREATE INDEX IF NOT EXISTS "User_serverId_idx" ON "User"("serverId");

-- ReferralRedemption
ALTER TABLE "ReferralRedemption" ADD COLUMN IF NOT EXISTS "serverId" TEXT NOT NULL DEFAULT 'dc';
CREATE INDEX IF NOT EXISTS "ReferralRedemption_serverId_idx" ON "ReferralRedemption"("serverId");

-- Arena
ALTER TABLE "Arena" ADD COLUMN IF NOT EXISTS "serverId" TEXT NOT NULL DEFAULT 'dc';
ALTER TABLE "Arena" DROP CONSTRAINT IF EXISTS "Arena_slug_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Arena_serverId_slug_key" ON "Arena"("serverId", "slug");
CREATE INDEX IF NOT EXISTS "Arena_serverId_idx" ON "Arena"("serverId");

-- Fight
ALTER TABLE "Fight" ADD COLUMN IF NOT EXISTS "serverId" TEXT NOT NULL DEFAULT 'dc';
ALTER TABLE "Fight" DROP CONSTRAINT IF EXISTS "Fight_fightNumber_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Fight_serverId_fightNumber_key" ON "Fight"("serverId", "fightNumber");
CREATE INDEX IF NOT EXISTS "Fight_serverId_idx" ON "Fight"("serverId");

-- WalletTransaction
ALTER TABLE "WalletTransaction" ADD COLUMN IF NOT EXISTS "serverId" TEXT NOT NULL DEFAULT 'dc';
CREATE INDEX IF NOT EXISTS "WalletTransaction_serverId_idx" ON "WalletTransaction"("serverId");

-- DepositRequest
ALTER TABLE "DepositRequest" ADD COLUMN IF NOT EXISTS "serverId" TEXT NOT NULL DEFAULT 'dc';
CREATE INDEX IF NOT EXISTS "DepositRequest_serverId_idx" ON "DepositRequest"("serverId");

-- WithdrawRequest
ALTER TABLE "WithdrawRequest" ADD COLUMN IF NOT EXISTS "serverId" TEXT NOT NULL DEFAULT 'dc';
CREATE INDEX IF NOT EXISTS "WithdrawRequest_serverId_idx" ON "WithdrawRequest"("serverId");

-- AdminAuditLog
ALTER TABLE "AdminAuditLog" ADD COLUMN IF NOT EXISTS "serverId" TEXT NOT NULL DEFAULT 'dc';
CREATE INDEX IF NOT EXISTS "AdminAuditLog_serverId_idx" ON "AdminAuditLog"("serverId");

-- PlatformSetting: composite primary key
ALTER TABLE "PlatformSetting" ADD COLUMN IF NOT EXISTS "serverId" TEXT NOT NULL DEFAULT 'dc';
ALTER TABLE "PlatformSetting" DROP CONSTRAINT IF EXISTS "PlatformSetting_pkey";
ALTER TABLE "PlatformSetting" ADD CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("serverId", "key");

-- EvidenceSubmission
ALTER TABLE "EvidenceSubmission" ADD COLUMN IF NOT EXISTS "serverId" TEXT NOT NULL DEFAULT 'dc';
CREATE INDEX IF NOT EXISTS "EvidenceSubmission_serverId_idx" ON "EvidenceSubmission"("serverId");

-- Notification
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "serverId" TEXT NOT NULL DEFAULT 'dc';
CREATE INDEX IF NOT EXISTS "Notification_serverId_idx" ON "Notification"("serverId");
