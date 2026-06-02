-- WalletTransactionType enum additions
ALTER TYPE "WalletTransactionType" ADD VALUE IF NOT EXISTS 'WITHDRAWAL_LOCK';
ALTER TYPE "WalletTransactionType" ADD VALUE IF NOT EXISTS 'WITHDRAWAL_PAID';
ALTER TYPE "WalletTransactionType" ADD VALUE IF NOT EXISTS 'PLATFORM_FEE';

-- NotificationType additions
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DEPOSIT_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DEPOSIT_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'WITHDRAWAL_PAID';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'WITHDRAWAL_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'WITHDRAWAL_REQUESTED';

-- WithdrawRequestStatus
ALTER TYPE "WithdrawRequestStatus" ADD VALUE IF NOT EXISTS 'APPROVED';

-- DepositRequest: proofUrl -> proofImageUrl, note
ALTER TABLE "DepositRequest" ADD COLUMN IF NOT EXISTS "note" TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'DepositRequest' AND column_name = 'proofUrl'
  ) THEN
    ALTER TABLE "DepositRequest" RENAME COLUMN "proofUrl" TO "proofImageUrl";
  END IF;
END $$;

ALTER TABLE "DepositRequest" ADD COLUMN IF NOT EXISTS "proofImageUrl" TEXT;
UPDATE "DepositRequest" SET "proofImageUrl" = '/uploads/wallet-proofs/legacy-placeholder.png' WHERE "proofImageUrl" IS NULL;
ALTER TABLE "DepositRequest" ALTER COLUMN "proofImageUrl" SET NOT NULL;

-- WithdrawRequest fields
ALTER TABLE "WithdrawRequest" ADD COLUMN IF NOT EXISTS "minecraftUsername" TEXT;
ALTER TABLE "WithdrawRequest" ADD COLUMN IF NOT EXISTS "note" TEXT;
UPDATE "WithdrawRequest" w SET "minecraftUsername" = u."minecraftUsername"
FROM "User" u WHERE w."userId" = u.id AND w."minecraftUsername" IS NULL;
UPDATE "WithdrawRequest" SET "minecraftUsername" = 'Unknown' WHERE "minecraftUsername" IS NULL;
ALTER TABLE "WithdrawRequest" ALTER COLUMN "minecraftUsername" SET NOT NULL;

-- WalletTransaction request links
ALTER TABLE "WalletTransaction" ADD COLUMN IF NOT EXISTS "depositRequestId" TEXT;
ALTER TABLE "WalletTransaction" ADD COLUMN IF NOT EXISTS "withdrawRequestId" TEXT;

ALTER TABLE "WalletTransaction" DROP CONSTRAINT IF EXISTS "WalletTransaction_depositRequestId_fkey";
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_depositRequestId_fkey"
  FOREIGN KEY ("depositRequestId") REFERENCES "DepositRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WalletTransaction" DROP CONSTRAINT IF EXISTS "WalletTransaction_withdrawRequestId_fkey";
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_withdrawRequestId_fkey"
  FOREIGN KEY ("withdrawRequestId") REFERENCES "WithdrawRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migrate legacy transaction types
UPDATE "WalletTransaction" SET type = 'WITHDRAWAL_PAID' WHERE type = 'WITHDRAW';
