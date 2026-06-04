import { getServerConfig, type ServerId } from "@/lib/server-config";

const UNKNOWN_SUFFIX = "????";

/** Public fight code used in UI, local chat, notifications, and ledger (e.g. ArenaSW-0001). */
export function formatFightPublicId(serverId: ServerId, fightNumber: number): string {
  const n = Math.floor(Number(fightNumber));
  const prefix = getServerConfig(serverId).fightIdPrefix;
  if (!Number.isFinite(n) || n < 1) {
    return `${prefix}-${UNKNOWN_SUFFIX}`;
  }
  return `${prefix}-${String(n).padStart(4, "0")}`;
}

/** @deprecated Use formatFightPublicId — kept for call-site clarity. */
export function formatFightDisplayId(serverId: ServerId, fightNumber: number): string {
  return formatFightPublicId(serverId, fightNumber);
}

export function coerceFightNumber(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.floor(n);
}

export function buildFightDisplayFields(
  fight: {
    fightNumber?: unknown;
    id: string;
    serverId?: string;
  },
  serverId: ServerId,
): { fightNumber: number; displayId: string } {
  const fightNumber = coerceFightNumber(fight.fightNumber);
  const sid = (fight.serverId ?? serverId) as ServerId;
  if (fightNumber != null) {
    return { fightNumber, displayId: formatFightPublicId(sid, fightNumber) };
  }
  const prefix = getServerConfig(sid).fightIdPrefix;
  return { fightNumber: 0, displayId: `${prefix}-${UNKNOWN_SUFFIX}` };
}

/** Example label for prep UI when fight number is not assigned yet. */
export function formatFightPublicIdExample(serverId: ServerId): string {
  return formatFightPublicId(serverId, 1);
}
