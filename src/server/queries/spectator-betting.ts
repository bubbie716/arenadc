import {
  SpectatorBetStatus,
  SpectatorBettingStatus,
  FightStatus,
} from "@prisma/client";
import {
  aggregateSpectatorPools,
  previewSpectatorPayoutForSide,
} from "@/lib/spectator-betting/parimutuel";
import { POOL_DISPLAY_BET_STATUSES } from "@/lib/spectator-betting/constants";
import { isSpectatorBettingOpen, repairSpectatorPoolForCompletedFight } from "@/server/spectator-betting";
import { prisma } from "@/lib/prisma";
import { getScopedServerId } from "@/server/scope";
import type { SpectatorPoolSummary } from "@/lib/types";

function mapBettingStatus(status: SpectatorBettingStatus): SpectatorPoolSummary["status"] {
  return status.toLowerCase() as SpectatorPoolSummary["status"];
}

export async function getSpectatorPoolSummary(
  fightId: string,
  userId?: string | null,
): Promise<SpectatorPoolSummary | null> {
  const serverId = await getScopedServerId();
  const fight = await prisma.fight.findFirst({
    where: { id: fightId, serverId },
    select: {
      id: true,
      playerAId: true,
      playerBId: true,
      status: true,
      scheduledAt: true,
      spectatorBettingEnabled: true,
      spectatorBettingStatus: true,
      spectatorBettingClosesAt: true,
      spectatorPoolFeePercent: true,
      playerA: { select: { minecraftUsername: true } },
      playerB: { select: { minecraftUsername: true } },
    },
  });

  if (!fight?.spectatorBettingEnabled || !fight.playerAId || !fight.playerBId) {
    return null;
  }

  if (fight.status === FightStatus.COMPLETED) {
    await repairSpectatorPoolForCompletedFight(fightId).catch((error) => {
      console.error("[spectator-betting] repair failed", fightId, error);
    });
    const refreshed = await prisma.fight.findFirst({
      where: { id: fightId, serverId },
      select: { spectatorBettingStatus: true },
    });
    if (refreshed) {
      fight.spectatorBettingStatus = refreshed.spectatorBettingStatus;
    }
  }

  const bets = await prisma.spectatorBet.findMany({
    where: {
      fightId,
      status: { in: POOL_DISPLAY_BET_STATUSES },
    },
    select: { selectedFighterId: true, amount: true, userId: true, status: true },
  });

  const pools = aggregateSpectatorPools(bets, fight.playerAId, fight.playerBId);
  const userBetRows = userId
    ? await prisma.spectatorBet.findMany({
        where: {
          fightId,
          userId,
          status: { not: SpectatorBetStatus.CANCELLED },
        },
        orderBy: { createdAt: "desc" },
        select: {
          selectedFighterId: true,
          amount: true,
          status: true,
          payoutAmount: true,
        },
      })
    : [];

  const userBetRow = userBetRows[0] ?? null;
  const userHasPendingBetOnA = userBetRows.some(
    (bet) =>
      bet.selectedFighterId === fight.playerAId && bet.status === SpectatorBetStatus.PENDING,
  );
  const userHasPendingBetOnB = userBetRows.some(
    (bet) =>
      bet.selectedFighterId === fight.playerBId && bet.status === SpectatorBetStatus.PENDING,
  );

  let userSide: "a" | "b" | null = null;
  if (userBetRow) {
    userSide = userBetRow.selectedFighterId === fight.playerAId ? "a" : "b";
  }

  return {
    fightId: fight.id,
    playerAId: fight.playerAId,
    playerBId: fight.playerBId,
    playerAName: fight.playerA?.minecraftUsername ?? "Player A",
    playerBName: fight.playerB?.minecraftUsername ?? "Player B",
    enabled: fight.spectatorBettingEnabled,
    status: mapBettingStatus(fight.spectatorBettingStatus),
    closesAt: fight.spectatorBettingClosesAt?.toISOString() ?? fight.scheduledAt.toISOString(),
    poolA: pools.poolA,
    poolB: pools.poolB,
    totalPool: pools.totalPool,
    poolAPercent: pools.poolAPercent,
    poolBPercent: pools.poolBPercent,
    betCount: pools.betCount,
    bothSidesHaveLiquidity: pools.bothSidesHaveLiquidity,
    feePercent: fight.spectatorPoolFeePercent,
    canBet: isSpectatorBettingOpen(fight),
    userHasPendingBetOnA,
    userHasPendingBetOnB,
    userBet: userBetRow
      ? {
          amount: userBetRow.amount,
          side: userSide!,
          selectedFighterId: userBetRow.selectedFighterId,
          status: userBetRow.status.toLowerCase() as "pending" | "won" | "lost" | "refunded",
          payoutAmount: userBetRow.payoutAmount,
        }
      : null,
  };
}

export async function getSpectatorPoolSummariesForFights(
  fightIds: string[],
): Promise<Record<string, SpectatorPoolSummary>> {
  if (fightIds.length === 0) return {};

  const serverId = await getScopedServerId();
  const fights = await prisma.fight.findMany({
    where: {
      serverId,
      id: { in: fightIds },
      spectatorBettingEnabled: true,
    },
    select: {
      id: true,
      playerAId: true,
      playerBId: true,
      status: true,
      scheduledAt: true,
      spectatorBettingEnabled: true,
      spectatorBettingStatus: true,
      spectatorBettingClosesAt: true,
      spectatorPoolFeePercent: true,
      playerA: { select: { minecraftUsername: true } },
      playerB: { select: { minecraftUsername: true } },
    },
  });

  const bets = await prisma.spectatorBet.findMany({
    where: {
      fightId: { in: fights.map((f) => f.id) },
      status: { in: POOL_DISPLAY_BET_STATUSES },
    },
    select: { fightId: true, selectedFighterId: true, amount: true },
  });

  const betsByFight = new Map<string, typeof bets>();
  for (const bet of bets) {
    const list = betsByFight.get(bet.fightId) ?? [];
    list.push(bet);
    betsByFight.set(bet.fightId, list);
  }

  const result: Record<string, SpectatorPoolSummary> = {};
  for (const fight of fights) {
    if (!fight.playerAId || !fight.playerBId) continue;
    const fightBets = betsByFight.get(fight.id) ?? [];
    const pools = aggregateSpectatorPools(fightBets, fight.playerAId, fight.playerBId);

    result[fight.id] = {
      fightId: fight.id,
      playerAId: fight.playerAId,
      playerBId: fight.playerBId,
      playerAName: fight.playerA?.minecraftUsername ?? "Player A",
      playerBName: fight.playerB?.minecraftUsername ?? "Player B",
      enabled: fight.spectatorBettingEnabled,
      status: mapBettingStatus(fight.spectatorBettingStatus),
      closesAt: fight.spectatorBettingClosesAt?.toISOString() ?? fight.scheduledAt.toISOString(),
      poolA: pools.poolA,
      poolB: pools.poolB,
      totalPool: pools.totalPool,
      poolAPercent: pools.poolAPercent,
      poolBPercent: pools.poolBPercent,
      betCount: pools.betCount,
      bothSidesHaveLiquidity: pools.bothSidesHaveLiquidity,
      feePercent: fight.spectatorPoolFeePercent,
      canBet: isSpectatorBettingOpen(fight),
      userBet: null,
    };
  }

  return result;
}

export function previewSpectatorPayout(
  summary: SpectatorPoolSummary,
  side: "a" | "b",
  amount: number,
): number {
  return previewSpectatorPayoutForSide(summary, side, amount);
}

export async function getAdminSpectatorPoolStats(fightId: string) {
  const serverId = await getScopedServerId();
  const fight = await prisma.fight.findFirst({
    where: { id: fightId, serverId },
    select: {
      spectatorBettingEnabled: true,
      spectatorBettingStatus: true,
      spectatorPoolsSettledAt: true,
      playerAId: true,
      playerBId: true,
    },
  });

  if (!fight?.spectatorBettingEnabled) return null;

  const bets = await prisma.spectatorBet.findMany({
    where: { fightId },
    select: { selectedFighterId: true, amount: true, status: true },
  });

  const displayBets = bets.filter((b) =>
    POOL_DISPLAY_BET_STATUSES.includes(b.status as (typeof POOL_DISPLAY_BET_STATUSES)[number]),
  );
  const pending = bets.filter((b) => b.status === SpectatorBetStatus.PENDING);
  const pools =
    fight.playerAId && fight.playerBId
      ? aggregateSpectatorPools(displayBets, fight.playerAId, fight.playerBId)
      : null;

  return {
    status: fight.spectatorBettingStatus,
    settledAt: fight.spectatorPoolsSettledAt?.toISOString() ?? null,
    totalBets: bets.length,
    pendingBets: pending.length,
    poolA: pools?.poolA ?? 0,
    poolB: pools?.poolB ?? 0,
    totalPool: pools?.totalPool ?? 0,
    bothSidesHaveLiquidity: pools?.bothSidesHaveLiquidity ?? false,
  };
}
