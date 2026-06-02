import { PLATFORM_FEE_PERCENT } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

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

const DEFAULTS: Record<(typeof PLATFORM_SETTING_KEYS)[number], string> = {
  platform_fee_percent: String(PLATFORM_FEE_PERCENT),
  deposit_account_name: "ArenaMC Treasury",
  discord_invite_url: "https://discord.gg/arenamc",
  fight_creation_enabled: "true",
  withdrawals_enabled: "true",
  maintenance_mode: "false",
  referrals_enabled: "true",
  referral_new_user_bonus: "100",
  referral_referrer_bonus: "100",
};

export type PlatformSettingsMap = Record<(typeof PLATFORM_SETTING_KEYS)[number], string>;

export async function ensurePlatformSettings() {
  for (const key of PLATFORM_SETTING_KEYS) {
    await prisma.platformSetting.upsert({
      where: { key },
      create: { key, value: DEFAULTS[key] },
      update: {},
    });
  }
}

export async function getPlatformSettings(): Promise<PlatformSettingsMap> {
  await ensurePlatformSettings();
  const rows = await prisma.platformSetting.findMany({
    where: { key: { in: [...PLATFORM_SETTING_KEYS] } },
  });
  const map = { ...DEFAULTS } as PlatformSettingsMap;
  for (const row of rows) {
    if (PLATFORM_SETTING_KEYS.includes(row.key as (typeof PLATFORM_SETTING_KEYS)[number])) {
      map[row.key as (typeof PLATFORM_SETTING_KEYS)[number]] = row.value;
    }
  }
  return map;
}

export async function getAdminAuditLog(limit = 100) {
  return prisma.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      admin: { select: { discordUsername: true, minecraftUsername: true } },
    },
  });
}
