-- Community pick votes (one per user per fight)
CREATE TYPE "CommunityPickSide" AS ENUM ('PLAYER_A', 'PLAYER_B');

CREATE TABLE "FightCommunityVote" (
    "id" TEXT NOT NULL,
    "fightId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "side" "CommunityPickSide" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FightCommunityVote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FightCommunityVote_fightId_userId_key" ON "FightCommunityVote"("fightId", "userId");
CREATE INDEX "FightCommunityVote_fightId_idx" ON "FightCommunityVote"("fightId");

ALTER TABLE "FightCommunityVote" ADD CONSTRAINT "FightCommunityVote_fightId_fkey" FOREIGN KEY ("fightId") REFERENCES "Fight"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FightCommunityVote" ADD CONSTRAINT "FightCommunityVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
