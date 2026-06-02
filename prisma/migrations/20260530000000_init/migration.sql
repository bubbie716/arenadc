-- CreateEnum
CREATE TYPE "FightStatus" AS ENUM ('DRAFT', 'PENDING_ACCEPTANCE', 'OPEN', 'CONFIRMED', 'SCHEDULED', 'IN_PROGRESS', 'AWAITING_RESULT', 'AWAITING_RECORDINGS', 'DISPUTED', 'COMPLETED', 'DECLINED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('LOCKED', 'RELEASED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL_LOCK', 'WITHDRAWAL_PAID', 'WITHDRAWAL_RELEASE', 'ESCROW_LOCK', 'ESCROW_RELEASE', 'PAYOUT', 'PLATFORM_FEE', 'WAGER_LOSS', 'REFUND', 'ADMIN_ADJUSTMENT', 'WITHDRAW', 'FEE');

-- CreateEnum
CREATE TYPE "DepositRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "WithdrawRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED');

-- CreateEnum
CREATE TYPE "FightResultType" AS ENUM ('WIN', 'LOSS', 'DISPUTE');

-- CreateEnum
CREATE TYPE "EvidenceSubmissionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('FIGHT_INVITE', 'OPEN_CHALLENGE_ACCEPTED', 'FIGHT_ACCEPTED', 'FIGHT_DECLINED', 'FIGHT_DISPUTED', 'EVIDENCE_UPLOADED', 'FIGHT_RESOLVED', 'PAYOUT_COMPLETED', 'DEPOSIT_APPROVED', 'DEPOSIT_REJECTED', 'WITHDRAWAL_PAID', 'WITHDRAWAL_REJECTED', 'WITHDRAWAL_REQUESTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "discordUsername" TEXT NOT NULL,
    "minecraftUsername" TEXT,
    "avatarUrl" TEXT,
    "rulesAcceptedAt" TIMESTAMP(3),
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "walletBalance" INTEGER NOT NULL DEFAULT 0,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "walletFrozen" BOOLEAN NOT NULL DEFAULT false,
    "suspendedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Arena" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Arena_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fight" (
    "id" TEXT NOT NULL,
    "fightNumber" SERIAL NOT NULL,
    "createdById" TEXT NOT NULL,
    "opponentMcName" TEXT,
    "playerAId" TEXT,
    "playerBId" TEXT,
    "isOpenChallenge" BOOLEAN NOT NULL DEFAULT false,
    "ruleset" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "arenaId" TEXT NOT NULL,
    "fightLocation" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "wagerAmount" INTEGER NOT NULL,
    "status" "FightStatus" NOT NULL DEFAULT 'DRAFT',
    "winnerId" TEXT,
    "completedAt" TIMESTAMP(3),
    "round" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Escrow" (
    "id" TEXT NOT NULL,
    "fightId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "EscrowStatus" NOT NULL DEFAULT 'LOCKED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Escrow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "fightId" TEXT,
    "depositRequestId" TEXT,
    "withdrawRequestId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "proofImageUrl" TEXT NOT NULL,
    "note" TEXT,
    "status" "DepositRequestStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepositRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WithdrawRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "minecraftUsername" TEXT NOT NULL,
    "note" TEXT,
    "status" "WithdrawRequestStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WithdrawRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "note" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "FightResult" (
    "id" TEXT NOT NULL,
    "fightId" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "type" "FightResultType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FightResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceSubmission" (
    "id" TEXT NOT NULL,
    "fightId" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "proofUrl" TEXT NOT NULL,
    "notes" TEXT,
    "status" "EvidenceSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,

    CONSTRAINT "EvidenceSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateIndex
CREATE UNIQUE INDEX "User_discordId_key" ON "User"("discordId");

-- CreateIndex
CREATE UNIQUE INDEX "User_minecraftUsername_key" ON "User"("minecraftUsername");

-- CreateIndex
CREATE UNIQUE INDEX "Arena_slug_key" ON "Arena"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Fight_fightNumber_key" ON "Fight"("fightNumber");

-- CreateIndex
CREATE INDEX "Fight_status_idx" ON "Fight"("status");

-- CreateIndex
CREATE INDEX "Fight_scheduledAt_idx" ON "Fight"("scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "Escrow_fightId_userId_key" ON "Escrow"("fightId", "userId");

-- CreateIndex
CREATE INDEX "WalletTransaction_userId_createdAt_idx" ON "WalletTransaction"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "WalletTransaction_type_createdAt_idx" ON "WalletTransaction"("type", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "DepositRequest_status_createdAt_idx" ON "DepositRequest"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "DepositRequest_userId_idx" ON "DepositRequest"("userId");

-- CreateIndex
CREATE INDEX "WithdrawRequest_status_createdAt_idx" ON "WithdrawRequest"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "WithdrawRequest_userId_idx" ON "WithdrawRequest"("userId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminId_idx" ON "AdminAuditLog"("adminId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_targetType_targetId_idx" ON "AdminAuditLog"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "FightResult_fightId_reportedById_key" ON "FightResult"("fightId", "reportedById");

-- CreateIndex
CREATE INDEX "EvidenceSubmission_fightId_idx" ON "EvidenceSubmission"("fightId");

-- CreateIndex
CREATE UNIQUE INDEX "EvidenceSubmission_fightId_uploaderId_key" ON "EvidenceSubmission"("fightId", "uploaderId");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- AddForeignKey
ALTER TABLE "Fight" ADD CONSTRAINT "Fight_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fight" ADD CONSTRAINT "Fight_playerAId_fkey" FOREIGN KEY ("playerAId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fight" ADD CONSTRAINT "Fight_playerBId_fkey" FOREIGN KEY ("playerBId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fight" ADD CONSTRAINT "Fight_arenaId_fkey" FOREIGN KEY ("arenaId") REFERENCES "Arena"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Escrow" ADD CONSTRAINT "Escrow_fightId_fkey" FOREIGN KEY ("fightId") REFERENCES "Fight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Escrow" ADD CONSTRAINT "Escrow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_fightId_fkey" FOREIGN KEY ("fightId") REFERENCES "Fight"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_depositRequestId_fkey" FOREIGN KEY ("depositRequestId") REFERENCES "DepositRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_withdrawRequestId_fkey" FOREIGN KEY ("withdrawRequestId") REFERENCES "WithdrawRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositRequest" ADD CONSTRAINT "DepositRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositRequest" ADD CONSTRAINT "DepositRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawRequest" ADD CONSTRAINT "WithdrawRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawRequest" ADD CONSTRAINT "WithdrawRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FightResult" ADD CONSTRAINT "FightResult_fightId_fkey" FOREIGN KEY ("fightId") REFERENCES "Fight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FightResult" ADD CONSTRAINT "FightResult_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceSubmission" ADD CONSTRAINT "EvidenceSubmission_fightId_fkey" FOREIGN KEY ("fightId") REFERENCES "Fight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceSubmission" ADD CONSTRAINT "EvidenceSubmission_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceSubmission" ADD CONSTRAINT "EvidenceSubmission_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_relatedFightId_fkey" FOREIGN KEY ("relatedFightId") REFERENCES "Fight"("id") ON DELETE SET NULL ON UPDATE CASCADE;

