-- Replace file uploads with proof link submissions (V1)

DROP TABLE IF EXISTS "EvidenceUpload";

DROP TYPE IF EXISTS "EvidenceUploadStatus";

CREATE TYPE "EvidenceSubmissionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

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

CREATE UNIQUE INDEX "EvidenceSubmission_fightId_uploaderId_key" ON "EvidenceSubmission"("fightId", "uploaderId");
CREATE INDEX "EvidenceSubmission_fightId_idx" ON "EvidenceSubmission"("fightId");

ALTER TABLE "EvidenceSubmission"
  ADD CONSTRAINT "EvidenceSubmission_fightId_fkey"
  FOREIGN KEY ("fightId") REFERENCES "Fight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EvidenceSubmission"
  ADD CONSTRAINT "EvidenceSubmission_uploaderId_fkey"
  FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EvidenceSubmission"
  ADD CONSTRAINT "EvidenceSubmission_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
