-- Stoneworks deposit account: ArenaSW → 123lucas11 (matches server-config)
UPDATE "PlatformSetting"
SET "value" = '123lucas11', "updatedAt" = NOW()
WHERE "serverId" = 'sw' AND "key" = 'deposit_account_name' AND "value" = 'ArenaSW';
