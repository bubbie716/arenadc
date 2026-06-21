import { SpectatorBetStatus } from "@prisma/client";

/** Bets counted toward displayed pool totals (includes locked and settled). */
export const POOL_DISPLAY_BET_STATUSES: SpectatorBetStatus[] = [
  SpectatorBetStatus.PENDING,
  SpectatorBetStatus.WON,
  SpectatorBetStatus.LOST,
];

/** Bets still awaiting fight outcome settlement. */
export const POOL_PENDING_BET_STATUSES: SpectatorBetStatus[] = [
  SpectatorBetStatus.PENDING,
];
