import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { PLATFORM_FEE_PERCENT } from "./constants";
import type { ServerConfig } from "@/lib/server-config";
import { getServerConfig, type ServerId } from "@/lib/server-config";
import type { FightStatus, FormatId, RulesetId } from "./types";
import { FORMATS, LEGACY_FORMAT_LABELS, LEGACY_RULESET_LABELS, RULESETS } from "@/lib/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format amount with server currency (symbol + code). */
export function formatCurrency(
  amount: number,
  config: ServerConfig,
  options?: { compact?: boolean; symbolOnly?: boolean },
): string {
  const compact = options?.compact ?? false;
  const formattedAmount = compact && amount >= 1000
    ? `${amount % 1000 === 0 ? amount / 1000 : (amount / 1000).toFixed(1)}k`
    : amount.toLocaleString();

  const withSymbol = `${config.currencySymbol}${formattedAmount}`;

  if (options?.symbolOnly) {
    return withSymbol;
  }

  return `${withSymbol} ${config.currencyCode}`;
}

/** @deprecated Use formatCurrency(amount, config) with server config. */
export function formatRmd(amount: number, compact = false, serverId: ServerId = "dc"): string {
  return formatCurrency(amount, getServerConfig(serverId), { compact });
}

/** Stable date/time text for SSR + hydration (avoids locale literal differences like "," vs " at "). */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(d);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return `${get("month")} ${get("day")}, ${get("hour")}:${get("minute")} ${get("dayPeriod")}`;
}

/** Countdown text for a future scheduled time only (never "ended"). */
export function formatStartsIn(iso: string): string {
  return getStartsInCountdownText(iso);
}

/** Live countdown with seconds, e.g. "Starts in 26:05" or "Starts in 1:03:45". */
export function getStartsInCountdownText(iso: string, now = Date.now()): string {
  const diff = new Date(iso).getTime() - now;
  if (diff <= 0) return "Starting now";

  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  if (days > 0) {
    return `Starts in ${days}d ${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  }
  if (hours > 0) {
    return `Starts in ${hours}:${pad(mins)}:${pad(secs)}`;
  }
  return `Starts in ${pad(mins)}:${pad(secs)}`;
}

/** Relative "ended" text — only for completed fights. */
export function formatEndedAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return "Ended <1 min ago";

  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Ended ${mins} min ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 48) return `Ended ${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `Ended ${days}d ago`;
}

export function getFightStatusDisplay(input: {
  status: FightStatus;
  scheduledAt: string;
  completedAt?: string;
}): { primary: string; subtext: string } {
  const subtext = formatDate(input.scheduledAt);

  switch (input.status) {
    case "draft":
      return { primary: "Draft", subtext };
    case "pending_acceptance":
      return { primary: "Pending acceptance", subtext };
    case "open":
      return { primary: "Open Challenge", subtext };
    case "confirmed":
    case "scheduled":
      return {
        primary: formatStartsIn(input.scheduledAt),
        subtext,
      };
    case "in_progress":
      return {
        primary: "Fight in progress",
        subtext: "Awaiting fighter confirmation",
      };
    case "awaiting_result":
      return {
        primary: "Awaiting result",
        subtext: "Waiting for fighters to confirm",
      };
    case "awaiting_recordings":
      return {
        primary: "Awaiting recordings",
        subtext: "Submit POV proof links",
      };
    case "disputed":
      return {
        primary: "Disputed",
        subtext: "Admin review in progress",
      };
    case "completed":
      return {
        primary: formatEndedAgo(input.completedAt ?? input.scheduledAt),
        subtext: subtext,
      };
    case "cancelled":
      return { primary: "Cancelled", subtext };
    case "declined":
      return { primary: "Declined", subtext };
    case "refunded":
      return { primary: "Refunded", subtext };
    default:
      return { primary: "Unknown", subtext };
  }
}

/** @deprecated Use getFightStatusDisplay with fight status instead. */
export function formatCountdown(iso: string): {
  primary: string;
  subtext: string;
  isPast: boolean;
} {
  const subtext = formatDate(iso);
  const diff = new Date(iso).getTime() - Date.now();
  if (diff > 0) {
    return { primary: formatStartsIn(iso), subtext, isPast: false };
  }
  return { primary: "Past scheduled time", subtext, isPast: true };
}

export function formatRelativeTime(iso: string): string {
  return formatStartsIn(iso);
}

export function getRulesetLabel(id: RulesetId | string): string {
  return (
    RULESETS.find((r) => r.id === id)?.label ??
    LEGACY_RULESET_LABELS[id] ??
    id
  );
}

export function getFormatLabel(id: FormatId | string): string {
  return FORMATS.find((f) => f.id === id)?.label ?? LEGACY_FORMAT_LABELS[id] ?? id;
}

export function getFormatMaxRounds(format: FormatId | string): number {
  switch (format) {
    case "sudden_death":
    case "bo1":
      return 1;
    case "best_of_3":
    case "bo3":
      return 3;
    case "best_of_5":
    case "bo5":
      return 5;
    case "best_of_7":
    case "bo7":
      return 7;
    case "first_to_10":
      return 10;
    default:
      return 3;
  }
}

export function getArenaName(id: string, arenaName?: string): string {
  return arenaName ?? "Unknown Arena";
}

export function calculatePot(
  wagerPerFighter: number,
  platformFeePercent: number = PLATFORM_FEE_PERCENT,
) {
  const totalPot = wagerPerFighter * 2;
  const platformFee = Math.floor(totalPot * (platformFeePercent / 100));
  const winnerPayout = totalPot - platformFee;
  return { totalPot, platformFee, winnerPayout };
}

export function getStatusLabel(status: FightStatus): string {
  const labels: Record<FightStatus, string> = {
    draft: "Draft",
    pending_acceptance: "Pending",
    open: "Open Challenge",
    confirmed: "Confirmed",
    scheduled: "Scheduled",
    in_progress: "In Progress",
    awaiting_result: "Awaiting Result",
    awaiting_recordings: "Awaiting Recordings",
    completed: "Completed",
    disputed: "Disputed",
    cancelled: "Cancelled",
    declined: "Declined",
    refunded: "Refunded",
  };
  return labels[status];
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export { formatFightDisplayId, buildFightDisplayFields } from "@/lib/fight-display";

/** Value for `<input type="datetime-local" />` — default 30 minutes from now. */
export function defaultScheduleDateTimeLocal(offsetMinutes = 30): string {
  const d = new Date(Date.now() + offsetMinutes * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function isHighStakesFight(wagerAmount: number): boolean {
  return wagerAmount * 2 >= 20000 || wagerAmount >= 10000;
}
