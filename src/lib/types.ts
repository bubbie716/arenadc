export type FightStatus =
  | "draft"
  | "pending_acceptance"
  | "open"
  | "confirmed"
  | "scheduled"
  | "in_progress"
  | "awaiting_result"
  | "awaiting_recordings"
  | "completed"
  | "disputed"
  | "cancelled"
  | "declined"
  | "refunded";

export type EvidenceSubmissionStatus = "pending" | "accepted" | "rejected";

export interface EvidenceSubmission {
  id: string;
  fightId: string;
  uploaderId: string;
  uploaderName: string;
  proofUrl: string;
  notes: string | null;
  status: EvidenceSubmissionStatus;
  createdAt: string;
  reviewedAt: string | null;
}

export type NotificationType =
  | "fight_invite"
  | "open_challenge_accepted"
  | "fight_accepted"
  | "fight_declined"
  | "fight_disputed"
  | "evidence_uploaded"
  | "fight_resolved"
  | "payout_completed"
  | "deposit_approved"
  | "deposit_rejected"
  | "withdrawal_paid"
  | "withdrawal_rejected"
  | "withdrawal_requested";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedFightId: string | null;
  readAt: string | null;
  createdAt: string;
}

export type RulesetId =
  | "no_armor_fists"
  | "no_armor_sword"
  | "diamond_armor"
  | "iron_armor"
  | "wood_sword"
  | "bow_only"
  | "no_healing"
  | "custom";

export type FormatId = "bo1" | "bo3" | "bo5" | "bo7" | "first_to_10";

export interface Ruleset {
  id: RulesetId;
  label: string;
}

export interface Format {
  id: FormatId;
  label: string;
}

export interface Arena {
  id: string;
  name: string;
  description: string;
}

export interface FighterStats {
  record: { wins: number; losses: number };
  winRate: number;
  currentStreak: number;
  totalEarnings: number;
}

export type FighterBadgeId = "top_50" | "upset_king" | "win_streak" | "veteran";

export interface User {
  id: string;
  minecraftUsername: string;
  discordUsername: string;
  stats: FighterStats;
  totalWagered: number;
  favoriteRuleset: RulesetId;
  walletBalance: number;
  escrowBalance: number;
  lifetimeEarnings: number;
  onboardingComplete: boolean;
  rank?: number;
  biggestWin?: number;
  badges?: FighterBadgeId[];
}

export type FightHypeTag = "high_stakes" | "rivalry" | "ranked" | "disputed";

export interface Fight {
  id: string;
  /** Sequential display number (database autoincrement). */
  fightNumber: number;
  /** Formatted label, e.g. Fight-0001 */
  displayId: string;
  playerA: string;
  playerB: string;
  ruleset: RulesetId;
  format: FormatId;
  arenaId: string;
  scheduledAt: string;
  wagerAmount: number;
  status: FightStatus;
  winner?: string;
  completedAt?: string;
  createdAt: string;
  round?: number;
  arenaName?: string;
  fightLocation?: string;
}

export interface TrendingFighter {
  username: string;
  rank: number;
  record: { wins: number; losses: number };
  winRate: number;
  streak: number;
  biggestWin: number;
}

export interface Rivalry {
  playerA: string;
  playerB: string;
  seriesRecord: { a: number; b: number };
  nextFightId: string;
  nextFightLabel: string;
}

export interface PlatformStats {
  activeFighters: number;
  rmdWageredToday: number;
  fightsThisWeek: number;
  largestPotToday: number;
}

export interface CommunityPick {
  fightId: string;
  playerAPercent: number;
  playerBPercent: number;
}

export interface PendingEscrow {
  fightId: string;
  opponent: string;
  amount: number;
  scheduledAt: string;
}

export interface UpcomingPayout {
  fightId: string;
  opponent: string;
  estimatedAmount: number;
  label: string;
}

export type TransactionType =
  | "deposit"
  | "withdraw"
  | "withdrawal_lock"
  | "withdrawal_paid"
  | "withdrawal_release"
  | "escrow"
  | "payout"
  | "loss"
  | "fee"
  | "platform_fee"
  | "refund"
  | "admin_adjustment";

export type WalletRequestStatus = "pending" | "approved" | "rejected" | "paid";

export interface WalletDepositRequest {
  id: string;
  amount: number;
  proofImageUrl: string;
  note: string | null;
  status: WalletRequestStatus;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface WalletWithdrawRequest {
  id: string;
  amount: number;
  minecraftUsername: string;
  note: string | null;
  status: WalletRequestStatus;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  createdAt: string;
  fightId?: string;
}
