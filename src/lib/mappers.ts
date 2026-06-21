import type {
  EvidenceSubmissionStatus as DbEvidenceStatus,
  FightStatus as DbFightStatus,
  NotificationType as DbNotificationType,
} from "@prisma/client";
import { buildFightDisplayFields } from "@/lib/fight-display";
import type { ServerId } from "@/lib/server-config";
import type {
  AppNotification,
  EvidenceSubmission,
  EvidenceSubmissionStatus,
  Fight,
  FightStatus,
  NotificationType,
} from "@/lib/types";

type FightWithPlayers = {
  id: string;
  serverId: string;
  fightNumber: number;
  createdById: string;
  opponentMcName: string | null;
  playerAId: string | null;
  playerBId: string | null;
  isOpenChallenge: boolean;
  ruleset: string;
  format: string;
  arenaId: string;
  fightLocation: string | null;
  scheduledAt: Date;
  wagerAmount: number;
  status: DbFightStatus;
  winnerId: string | null;
  completedAt: Date | null;
  createdAt: Date;
  round: number | null;
  createdBy: { minecraftUsername: string | null; discordUsername?: string | null };
  playerA: { minecraftUsername: string | null } | null;
  playerB: { minecraftUsername: string | null } | null;
  arena: { name: string; slug: string };
};

const STATUS_MAP: Record<DbFightStatus, FightStatus> = {
  DRAFT: "draft",
  PENDING_ACCEPTANCE: "pending_acceptance",
  OPEN: "open",
  CONFIRMED: "confirmed",
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  AWAITING_RESULT: "awaiting_result",
  AWAITING_RECORDINGS: "awaiting_recordings",
  COMPLETED: "completed",
  DISPUTED: "disputed",
  DECLINED: "declined",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
};

export function mapFightStatus(status: DbFightStatus): FightStatus {
  return STATUS_MAP[status];
}

export function mapFightToUI(fight: FightWithPlayers): Fight {
  const playerAName =
    fight.playerA?.minecraftUsername ?? fight.createdBy.minecraftUsername ?? "Unknown";
  const playerBName =
    fight.playerB?.minecraftUsername ??
    fight.opponentMcName ??
    (fight.isOpenChallenge ? "TBD" : "TBD");

  let winner: string | undefined;
  if (fight.winnerId) {
    if (fight.playerAId === fight.winnerId) winner = playerAName;
    else if (fight.playerBId === fight.winnerId) winner = playerBName;
  }

  const { fightNumber, displayId } = buildFightDisplayFields(
    fight,
    fight.serverId as ServerId,
  );

  return {
    id: fight.id,
    fightNumber,
    displayId,
    playerA: playerAName,
    playerB: playerBName,
    ruleset: fight.ruleset as Fight["ruleset"],
    format: fight.format as Fight["format"],
    arenaId: fight.arenaId,
    scheduledAt: fight.scheduledAt.toISOString(),
    wagerAmount: fight.wagerAmount,
    status: mapFightStatus(fight.status),
    winner,
    completedAt: fight.completedAt?.toISOString(),
    createdAt: fight.createdAt.toISOString(),
    round: fight.round ?? undefined,
    arenaName: fight.arena.name,
    fightLocation: fight.fightLocation ?? undefined,
  };
}

export const fightInclude = {
  createdBy: { select: { minecraftUsername: true, discordUsername: true } },
  playerA: { select: { minecraftUsername: true } },
  playerB: { select: { minecraftUsername: true } },
  arena: { select: { name: true, slug: true } },
} as const;

const EVIDENCE_STATUS_MAP: Record<DbEvidenceStatus, EvidenceSubmissionStatus> = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
};

export function mapEvidenceStatus(status: DbEvidenceStatus): EvidenceSubmissionStatus {
  return EVIDENCE_STATUS_MAP[status];
}

export function mapEvidenceSubmission(row: {
  id: string;
  fightId: string;
  uploaderId: string;
  proofUrl: string;
  notes: string | null;
  status: DbEvidenceStatus;
  createdAt: Date;
  reviewedAt: Date | null;
  uploader: { minecraftUsername: string | null };
}): EvidenceSubmission {
  return {
    id: row.id,
    fightId: row.fightId,
    uploaderId: row.uploaderId,
    uploaderName: row.uploader.minecraftUsername ?? "Unknown",
    proofUrl: row.proofUrl,
    notes: row.notes,
    status: mapEvidenceStatus(row.status),
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
  };
}

const NOTIFICATION_TYPE_MAP: Record<DbNotificationType, NotificationType> = {
  FIGHT_INVITE: "fight_invite",
  OPEN_CHALLENGE_ACCEPTED: "open_challenge_accepted",
  FIGHT_ACCEPTED: "fight_accepted",
  FIGHT_DECLINED: "fight_declined",
  FIGHT_DISPUTED: "fight_disputed",
  EVIDENCE_UPLOADED: "evidence_uploaded",
  FIGHT_RESOLVED: "fight_resolved",
  PAYOUT_COMPLETED: "payout_completed",
  DEPOSIT_APPROVED: "deposit_approved",
  DEPOSIT_REJECTED: "deposit_rejected",
  DEPOSIT_REQUESTED: "deposit_requested",
  DEPOSIT_SUBMITTED: "deposit_submitted",
  WITHDRAWAL_PAID: "withdrawal_paid",
  WITHDRAWAL_REJECTED: "withdrawal_rejected",
  WITHDRAWAL_REQUESTED: "withdrawal_requested",
  WITHDRAWAL_SUBMITTED: "withdrawal_submitted",
  ADMIN_BALANCE_ADJUSTMENT: "admin_balance_adjustment",
  WALLET_FROZEN: "wallet_frozen",
  WALLET_UNFROZEN: "wallet_unfrozen",
  ACCOUNT_SUSPENDED: "account_suspended",
  ACCOUNT_UNSUSPENDED: "account_unsuspended",
  REFERRAL_BONUS_RECEIVED: "referral_bonus_received",
  REFERRAL_BONUS_EARNED: "referral_bonus_earned",
  SPECTATOR_BET_WON: "spectator_bet_won",
  SPECTATOR_BET_LOST: "spectator_bet_lost",
  SPECTATOR_BET_REFUNDED: "spectator_bet_refunded",
};

export function mapNotification(row: {
  id: string;
  type: DbNotificationType;
  title: string;
  message: string;
  relatedFightId: string | null;
  readAt: Date | null;
  createdAt: Date;
}): AppNotification {
  return {
    id: row.id,
    type: NOTIFICATION_TYPE_MAP[row.type],
    title: row.title,
    message: row.message,
    relatedFightId: row.relatedFightId,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}
