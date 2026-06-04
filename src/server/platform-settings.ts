import { PLATFORM_FEE_PERCENT } from "@/lib/constants";
import { getActiveServerConfig } from "@/lib/server-context";
import {
  getPlatformSettings,
  type PlatformSettingsMap,
} from "@/server/queries/admin/settings";
import { getScopedServerId } from "@/server/scope";

export type ResolvedPlatformSettings = {
  platformFeePercent: number;
  depositAccountName: string;
  discordInviteUrl: string;
  fightCreationEnabled: boolean;
  withdrawalsEnabled: boolean;
  maintenanceMode: boolean;
  referralsEnabled: boolean;
  referralNewUserBonus: number;
  referralReferrerBonus: number;
};

const DEFAULT_DISCORD_INVITE = "https://discord.gg/arenamc";

const caches = new Map<string, { at: number; raw: PlatformSettingsMap }>();
const CACHE_TTL_MS = 15_000;

export function invalidatePlatformSettingsCache(serverId?: string) {
  if (serverId) {
    caches.delete(serverId);
  } else {
    caches.clear();
  }
}

async function getRawSettings(): Promise<PlatformSettingsMap> {
  const serverId = await getScopedServerId();
  const cached = caches.get(serverId);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.raw;
  }
  const raw = await getPlatformSettings(serverId);
  caches.set(serverId, { at: Date.now(), raw });
  return raw;
}

export function parseSettingBool(value: string): boolean {
  return value.trim().toLowerCase() === "true";
}

function parseFeePercent(value: string): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    return PLATFORM_FEE_PERCENT;
  }
  return parsed;
}

function parseNonNegativeInt(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

export async function getResolvedPlatformSettings(): Promise<ResolvedPlatformSettings> {
  const config = await getActiveServerConfig();
  const raw = await getRawSettings();
  const depositAccountName = raw.deposit_account_name.trim() || config.depositAccountName;
  const discordInviteUrl = raw.discord_invite_url.trim() || DEFAULT_DISCORD_INVITE;

  return {
    platformFeePercent: parseFeePercent(raw.platform_fee_percent),
    depositAccountName,
    discordInviteUrl,
    fightCreationEnabled: parseSettingBool(raw.fight_creation_enabled),
    withdrawalsEnabled: parseSettingBool(raw.withdrawals_enabled),
    maintenanceMode: parseSettingBool(raw.maintenance_mode),
    referralsEnabled: parseSettingBool(raw.referrals_enabled),
    referralNewUserBonus: parseNonNegativeInt(raw.referral_new_user_bonus, 100),
    referralReferrerBonus: parseNonNegativeInt(raw.referral_referrer_bonus, 100),
  };
}

export async function getPlatformFeePercent(): Promise<number> {
  return (await getResolvedPlatformSettings()).platformFeePercent;
}
