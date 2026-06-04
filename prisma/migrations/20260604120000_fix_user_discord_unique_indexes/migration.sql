-- Init/referral migrations created global UNIQUE INDEXes (not CONSTRAINTs).
-- Multi-server migration only dropped CONSTRAINT IF EXISTS, so discordId stayed globally unique.

DROP INDEX IF EXISTS "User_discordId_key";
DROP INDEX IF EXISTS "User_minecraftUsername_key";
DROP INDEX IF EXISTS "User_referralCode_key";

CREATE UNIQUE INDEX IF NOT EXISTS "User_serverId_discordId_key" ON "User"("serverId", "discordId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_serverId_minecraftUsername_key" ON "User"("serverId", "minecraftUsername");
CREATE UNIQUE INDEX IF NOT EXISTS "User_serverId_referralCode_key" ON "User"("serverId", "referralCode");
