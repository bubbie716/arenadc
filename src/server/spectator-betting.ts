import {
  FightStatus,
  SpectatorBetStatus,
  SpectatorBettingStatus,
  WalletTransactionType,
  type Prisma,
} from "@prisma/client";
import { formatFightPublicId } from "@/lib/fight-display";
import {
  aggregateSpectatorPools,
  calculateSpectatorPayouts,
} from "@/lib/spectator-betting/parimutuel";
import { InsufficientBalanceError, postLedgerEntry } from "@/lib/wallet/ledger";
import { allowFighterSpectatorBets, allowMultipleSpectatorBetsPerUser } from "@/lib/spectator-betting/fighter-bets";
import { POOL_PENDING_BET_STATUSES } from "@/lib/spectator-betting/constants";
import { prisma } from "@/lib/prisma";
import { getScopedServerId } from "@/server/scope";
import { notifySpectatorBetOutcomes } from "@/server/notifications";

const BETTABLE_FIGHT_STATUSES: FightStatus[] = [FightStatus.CONFIRMED, FightStatus.SCHEDULED];

export function isSpectatorBettingOpen(fight: {
  spectatorBettingEnabled: boolean;
  spectatorBettingStatus: SpectatorBettingStatus;
  status: FightStatus;
  scheduledAt: Date;
  playerAId: string | null;
  playerBId: string | null;
}): boolean {
  if (!fight.spectatorBettingEnabled) return false;
  if (fight.spectatorBettingStatus !== SpectatorBettingStatus.OPEN) return false;
  if (!fight.playerAId || !fight.playerBId) return false;
  if (!BETTABLE_FIGHT_STATUSES.includes(fight.status)) return false;
  if (fight.status === FightStatus.IN_PROGRESS) return false;
  if (fight.scheduledAt.getTime() <= Date.now()) return false;
  return true;
}

export async function enableSpectatorBettingForFight(
  tx: Prisma.TransactionClient,
  fightId: string,
  scheduledAt: Date,
) {
  await tx.fight.update({
    where: { id: fightId },
    data: {
      spectatorBettingEnabled: true,
      spectatorBettingStatus: SpectatorBettingStatus.OPEN,
      spectatorBettingClosesAt: scheduledAt,
      spectatorPoolFeePercent: 0.08,
    },
  });
}

/** Lock open markets past close time or when fight is in progress. */
export async function syncSpectatorBettingMarkets(serverId?: string) {
  const sid = serverId ?? (await getScopedServerId());
  const now = new Date();

  const toLock = await prisma.fight.findMany({
    where: {
      serverId: sid,
      spectatorBettingEnabled: true,
      spectatorBettingStatus: SpectatorBettingStatus.OPEN,
      OR: [
        { scheduledAt: { lte: now } },
        { status: FightStatus.IN_PROGRESS },
        { status: { notIn: BETTABLE_FIGHT_STATUSES } },
      ],
    },
    select: { id: true },
  });

  for (const fight of toLock) {
    await lockSpectatorBettingMarket(fight.id);
  }
}

export async function lockSpectatorBettingMarket(fightId: string) {
  const serverId = await getScopedServerId();
  const fight = await prisma.fight.findFirst({
    where: { id: fightId, serverId },
    select: {
      id: true,
      spectatorBettingStatus: true,
      playerAId: true,
      playerBId: true,
    },
  });

  if (!fight || fight.spectatorBettingStatus !== SpectatorBettingStatus.OPEN) {
    return;
  }
  if (!fight.playerAId || !fight.playerBId) return;

  const pendingBets = await prisma.spectatorBet.findMany({
    where: {
      fightId,
      status: { in: POOL_PENDING_BET_STATUSES },
    },
    select: { selectedFighterId: true, amount: true },
  });

  const pools = aggregateSpectatorPools(pendingBets, fight.playerAId, fight.playerBId);

  if (pendingBets.length > 0 && !pools.bothSidesHaveLiquidity) {
    await refundSpectatorPool(fightId, "Prediction pool refunded: no opposing liquidity.");
    return;
  }

  await prisma.fight.update({
    where: { id: fightId },
    data: { spectatorBettingStatus: SpectatorBettingStatus.LOCKED },
  });
}

export async function refundSpectatorPool(fightId: string, reason?: string) {
  const serverId = await getScopedServerId();
  const fight = await prisma.fight.findFirst({
    where: { id: fightId, serverId },
    select: {
      id: true,
      fightNumber: true,
      spectatorBettingStatus: true,
    },
  });

  if (!fight) throw new Error("FIGHT_NOT_FOUND");
  if (
    fight.spectatorBettingStatus === SpectatorBettingStatus.REFUNDED ||
    fight.spectatorBettingStatus === SpectatorBettingStatus.SETTLED
  ) {
    return;
  }

  const fightLabel = formatFightPublicId(serverId, fight.fightNumber);
  const refundReason = reason ?? "Prediction pool refunded.";
  const notifyOutcomes: {
    userId: string;
    kind: "refunded";
    amount: number;
  }[] = [];

  await prisma.$transaction(async (tx) => {
    const pendingBets = await tx.spectatorBet.findMany({
      where: {
        fightId,
        status: SpectatorBetStatus.PENDING,
      },
    });

    for (const bet of pendingBets) {
      await postLedgerEntry(tx, {
        userId: bet.userId,
        type: WalletTransactionType.SPECTATOR_BET_REFUND,
        amount: bet.amount,
        description: `${refundReason} — ${fightLabel}`,
        fightId,
      });

      await tx.spectatorBet.update({
        where: { id: bet.id },
        data: {
          status: SpectatorBetStatus.REFUNDED,
          payoutAmount: bet.amount,
          settledAt: new Date(),
        },
      });

      notifyOutcomes.push({
        userId: bet.userId,
        kind: "refunded",
        amount: bet.amount,
      });
    }

    await tx.fight.update({
      where: { id: fightId },
      data: {
        spectatorBettingStatus: SpectatorBettingStatus.REFUNDED,
        spectatorPoolsSettledAt: new Date(),
      },
    });
  });

  if (notifyOutcomes.length > 0) {
    await notifySpectatorBetOutcomes({
      fightId,
      fightNumber: fight.fightNumber,
      outcomes: notifyOutcomes,
    });
  }
}

export async function ensureSpectatorPoolSettled(
  fightId: string,
  winnerFighterId: string,
  options?: { adminId?: string },
) {
  await lockSpectatorBettingMarket(fightId);
  await settleSpectatorPool(fightId, winnerFighterId, options);
}

export async function repairSpectatorPoolForCompletedFight(fightId: string) {
  const serverId = await getScopedServerId();
  const fight = await prisma.fight.findFirst({
    where: { id: fightId, serverId },
    select: {
      id: true,
      winnerId: true,
      status: true,
      spectatorBettingEnabled: true,
      spectatorBettingStatus: true,
    },
  });

  if (!fight?.spectatorBettingEnabled || !fight.winnerId) return;
  if (fight.status !== FightStatus.COMPLETED) return;
  if (
    fight.spectatorBettingStatus === SpectatorBettingStatus.SETTLED ||
    fight.spectatorBettingStatus === SpectatorBettingStatus.REFUNDED
  ) {
    return;
  }

  await ensureSpectatorPoolSettled(fightId, fight.winnerId);
}

export async function settleSpectatorPool(
  fightId: string,
  winnerFighterId: string,
  options?: { adminId?: string },
) {
  const serverId = await getScopedServerId();
  const fight = await prisma.fight.findFirst({
    where: { id: fightId, serverId },
    select: {
      id: true,
      fightNumber: true,
      playerAId: true,
      playerBId: true,
      spectatorBettingStatus: true,
      spectatorPoolFeePercent: true,
      spectatorBettingEnabled: true,
    },
  });

  if (!fight?.spectatorBettingEnabled) return;
  if (
    fight.spectatorBettingStatus === SpectatorBettingStatus.SETTLED ||
    fight.spectatorBettingStatus === SpectatorBettingStatus.REFUNDED
  ) {
    return;
  }
  if (!fight.playerAId || !fight.playerBId) return;
  if (winnerFighterId !== fight.playerAId && winnerFighterId !== fight.playerBId) {
    throw new Error("INVALID_WINNER");
  }

  const fightLabel = formatFightPublicId(serverId, fight.fightNumber);
  const notifyOutcomes: {
    userId: string;
    kind: "won" | "lost";
    amount: number;
    payout?: number;
  }[] = [];

  await prisma.$transaction(async (tx) => {
    const fightRow = await tx.fight.findFirst({
      where: { id: fightId, serverId },
      select: { spectatorBettingStatus: true },
    });

    if (
      !fightRow ||
      fightRow.spectatorBettingStatus === SpectatorBettingStatus.SETTLED ||
      fightRow.spectatorBettingStatus === SpectatorBettingStatus.REFUNDED
    ) {
      return;
    }

    const pendingBets = await tx.spectatorBet.findMany({
      where: { fightId, status: SpectatorBetStatus.PENDING },
      select: { id: true, userId: true, selectedFighterId: true, amount: true },
    });

    if (pendingBets.length === 0) {
      await tx.fight.update({
        where: { id: fightId },
        data: {
          spectatorBettingStatus: SpectatorBettingStatus.SETTLED,
          spectatorPoolsSettledAt: new Date(),
        },
      });
      return;
    }

    const pools = aggregateSpectatorPools(pendingBets, fight.playerAId!, fight.playerBId!);

    if (!pools.bothSidesHaveLiquidity) {
      throw new Error("SINGLE_SIDED_POOL");
    }

    const payouts = calculateSpectatorPayouts({
      bets: pendingBets,
      winnerFighterId,
      playerAId: fight.playerAId!,
      playerBId: fight.playerBId!,
      feePercent: fight.spectatorPoolFeePercent,
    });

    const payoutMap = new Map(payouts.map((p) => [p.betId, p.payout]));

    for (const bet of pendingBets) {
      const payout = payoutMap.get(bet.id) ?? 0;
      const won = bet.selectedFighterId === winnerFighterId && payout > 0;

      if (won) {
        await postLedgerEntry(tx, {
          userId: bet.userId,
          type: WalletTransactionType.SPECTATOR_BET_PAYOUT,
          amount: payout,
          description: `Prediction pool payout — ${fightLabel}`,
          fightId,
          createdById: options?.adminId ?? null,
        });
      }

      await tx.spectatorBet.update({
        where: { id: bet.id },
        data: {
          status: won ? SpectatorBetStatus.WON : SpectatorBetStatus.LOST,
          payoutAmount: won ? payout : 0,
          settledAt: new Date(),
        },
      });

      notifyOutcomes.push({
        userId: bet.userId,
        kind: won ? "won" : "lost",
        amount: bet.amount,
        payout: won ? payout : 0,
      });
    }

    await tx.fight.update({
      where: { id: fightId },
      data: {
        spectatorBettingStatus: SpectatorBettingStatus.SETTLED,
        spectatorPoolsSettledAt: new Date(),
      },
    });
  });

  if (notifyOutcomes.length > 0) {
    await notifySpectatorBetOutcomes({
      fightId,
      fightNumber: fight.fightNumber,
      outcomes: notifyOutcomes,
    });
  }
}

export async function placeSpectatorBet(params: {
  fightId: string;
  userId: string;
  selectedFighterId: string;
  amount: number;
}) {
  const serverId = await getScopedServerId();
  const { fightId, userId, selectedFighterId, amount } = params;

  if (!Number.isInteger(amount) || amount < 100) {
    throw new Error("MIN_BET");
  }

  const fight = await prisma.fight.findFirst({
    where: { id: fightId, serverId },
    select: {
      id: true,
      fightNumber: true,
      status: true,
      scheduledAt: true,
      playerAId: true,
      playerBId: true,
      spectatorBettingEnabled: true,
      spectatorBettingStatus: true,
    },
  });

  if (!fight || !isSpectatorBettingOpen(fight)) {
    throw new Error("BETTING_CLOSED");
  }

  if (
    !allowFighterSpectatorBets() &&
    (userId === fight.playerAId || userId === fight.playerBId)
  ) {
    throw new Error("FIGHTER_CANNOT_BET");
  }

  if (selectedFighterId !== fight.playerAId && selectedFighterId !== fight.playerBId) {
    throw new Error("INVALID_FIGHTER");
  }

  const fightLabel = formatFightPublicId(serverId, fight.fightNumber);

  try {
    await prisma.$transaction(async (tx) => {
      const fresh = await tx.fight.findFirst({
        where: { id: fightId, serverId },
        select: {
          status: true,
          scheduledAt: true,
          playerAId: true,
          playerBId: true,
          spectatorBettingEnabled: true,
          spectatorBettingStatus: true,
        },
      });

      if (!fresh || !isSpectatorBettingOpen(fresh)) {
        throw new Error("BETTING_CLOSED");
      }

      const existingBet = await tx.spectatorBet.findFirst({
        where: {
          fightId,
          userId,
          status: SpectatorBetStatus.PENDING,
          ...(allowMultipleSpectatorBetsPerUser() ? { selectedFighterId } : {}),
        },
      });
      if (existingBet) {
        throw new Error("ALREADY_BET");
      }

      await postLedgerEntry(tx, {
        userId,
        type: WalletTransactionType.SPECTATOR_BET_LOCK,
        amount: -amount,
        description: `Prediction pool lock — ${fightLabel}`,
        fightId,
      });

      await tx.spectatorBet.create({
        data: {
          serverId,
          fightId,
          userId,
          selectedFighterId,
          amount,
          status: SpectatorBetStatus.PENDING,
        },
      });
    });
  } catch (e) {
    if (e instanceof InsufficientBalanceError) {
      throw new Error("INSUFFICIENT_BALANCE");
    }
    throw e;
  }
}

export { InsufficientBalanceError };
