-- FightStatus expansion
ALTER TYPE "FightStatus" ADD VALUE IF NOT EXISTS 'DRAFT';
ALTER TYPE "FightStatus" ADD VALUE IF NOT EXISTS 'PENDING_ACCEPTANCE';
ALTER TYPE "FightStatus" ADD VALUE IF NOT EXISTS 'CONFIRMED';
ALTER TYPE "FightStatus" ADD VALUE IF NOT EXISTS 'AWAITING_RECORDINGS';
ALTER TYPE "FightStatus" ADD VALUE IF NOT EXISTS 'REFUNDED';

-- New enums
CREATE TYPE "EvidenceUploadStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
CREATE TYPE "NotificationType" AS ENUM (
  'FIGHT_INVITE',
  'OPEN_CHALLENGE_ACCEPTED',
  'FIGHT_ACCEPTED',
  'FIGHT_DECLINED',
  'FIGHT_DISPUTED',
  'EVIDENCE_UPLOADED',
  'FIGHT_RESOLVED',
  'PAYOUT_COMPLETED'
);

-- Direct challenges awaiting opponent: OPEN -> PENDING_ACCEPTANCE
UPDATE "Fight"
SET status = 'PENDING_ACCEPTANCE'
WHERE status = 'OPEN'
  AND "isOpenChallenge" = false
  AND "playerBId" IS NULL;

-- Evidence uploads
CREATE TABLE "EvidenceUpload" (
  "id" TEXT NOT NULL,
  "fightId" TEXT NOT NULL,
  "uploaderId" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileType" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "status" "EvidenceUploadStatus" NOT NULL DEFAULT 'PENDING',
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EvidenceUpload_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EvidenceUpload_fightId_uploaderId_idx" ON "EvidenceUpload"("fightId", "uploaderId");

ALTER TABLE "EvidenceUpload"
  ADD CONSTRAINT "EvidenceUpload_fightId_fkey"
  FOREIGN KEY ("fightId") REFERENCES "Fight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EvidenceUpload"
  ADD CONSTRAINT "EvidenceUpload_uploaderId_fkey"
  FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Notifications
CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "relatedFightId" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt" DESC);
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_relatedFightId_fkey"
  FOREIGN KEY ("relatedFightId") REFERENCES "Fight"("id") ON DELETE SET NULL ON UPDATE CASCADE;
