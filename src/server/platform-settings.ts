import { PLATFORM_FEE_PERCENT } from "@/lib/constants";
import {
  getPlatformSettings,
  type PlatformSettingsMap,
} from "@/server/queries/admin/settings";

export type ResolvedPlatformSettings = {
  platformFeePercent: number;
  depositAccountName: string;
  discordInviteUrl: string;
  fightCreationEnabled: boolean;
  withdrawalsEnabled: boolean;
  maintenanceMode: boolean;
};

const DEFAULT_DISCORD_INVITE = "https://discord.gg/arenamc";

let cache: { at: number; raw: PlatformSettingsMap } | null = null;
const CACHE_TTL_MS = 15_000;

export function invalidatePlatformSettingsCache() {
  cache = null;
}

async function getRawSettings(): Promise<PlatformSettingsMap> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.raw;
  }
  const raw = await getPlatformSettings();
  cache = { at: Date.now(), raw };
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

export async function getResolvedPlatformSettings(): Promise<ResolvedPlatformSettings> {
  const raw = await getRawSettings();
  const depositAccountName = raw.deposit_account_name.trim() || "ArenaMC";
  const discordInviteUrl = raw.discord_invite_url.trim() || DEFAULT_DISCORD_INVITE;

  return {
    platformFeePercent: parseFeePercent(raw.platform_fee_percent),
    depositAccountName,
    discordInviteUrl,
    fightCreationEnabled: parseSettingBool(raw.fight_creation_enabled),
    withdrawalsEnabled: parseSettingBool(raw.withdrawals_enabled),
    maintenanceMode: parseSettingBool(raw.maintenance_mode),
  };
}

export async function getPlatformFeePercent(): Promise<number> {
  return (await getResolvedPlatformSettings()).platformFeePercent;
}
