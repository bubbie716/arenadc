import { PLATFORM_FEE_PERCENT } from "@/lib/constants";
import { getServerConfig, type ServerId } from "@/lib/server-config";
import { prisma } from "@/lib/prisma";
import { getScopedServerId } from "@/server/scope";

export const PLATFORM_SETTING_KEYS = [
  "platform_fee_percent",
  "deposit_account_name",
  "discord_invite_url",
  "fight_creation_enabled",
  "withdrawals_enabled",
  "maintenance_mode",
  "referrals_enabled",
  "referral_new_user_bonus",
  "referral_referrer_bonus",
] as const;

function buildDefaults(serverId: ServerId): Record<(typeof PLATFORM_SETTING_KEYS)[number], string> {
  const config = getServerConfig(serverId);
  return {
    platform_fee_percent: String(PLATFORM_FEE_PERCENT),
    deposit_account_name: config.depositAccountName,
    discord_invite_url: "https://discord.gg/arenamc",
    fight_creation_enabled: "true",
    withdrawals_enabled: "true",
    maintenance_mode: "false",
    referrals_enabled: "true",
    referral_new_user_bonus: "100",
    referral_referrer_bonus: "100",
  };
}

export type PlatformSettingsMap = Record<(typeof PLATFORM_SETTING_KEYS)[number], string>;

export async function ensurePlatformSettings(serverId: ServerId) {
  const defaults = buildDefaults(serverId);
  for (const key of PLATFORM_SETTING_KEYS) {
    await prisma.platformSetting.upsert({
      where: { serverId_key: { serverId, key } },
      create: { serverId, key, value: defaults[key] },
      update: {},
    });
  }
}

export async function getPlatformSettings(serverId: ServerId): Promise<PlatformSettingsMap> {
  await ensurePlatformSettings(serverId);
  const defaults = buildDefaults(serverId);
  const rows = await prisma.platformSetting.findMany({
    where: { serverId, key: { in: [...PLATFORM_SETTING_KEYS] } },
  });
  const map = { ...defaults } as PlatformSettingsMap;
  for (const row of rows) {
    if (PLATFORM_SETTING_KEYS.includes(row.key as (typeof PLATFORM_SETTING_KEYS)[number])) {
      map[row.key as (typeof PLATFORM_SETTING_KEYS)[number]] = row.value;
    }
  }
  return map;
}

export async function getAdminAuditLog(limit = 100) {
  const serverId = await getScopedServerId();
  return prisma.adminAuditLog.findMany({
    where: { serverId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      admin: { select: { discordUsername: true, minecraftUsername: true } },
    },
  });
}
