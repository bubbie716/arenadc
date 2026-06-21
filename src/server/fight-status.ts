import { FightResultType, FightStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getScopedServerId } from "@/server/scope";
import { syncSpectatorBettingMarkets } from "@/server/spectator-betting";

/** Move accepted fights past their scheduled time into awaiting-result state. */
export async function syncPastScheduledFights() {
  const serverId = await getScopedServerId();
  await syncSpectatorBettingMarkets(serverId);
  const now = new Date();
  await prisma.fight.updateMany({
    where: {
      serverId,
      status: {
        in: [
          FightStatus.CONFIRMED,
          FightStatus.SCHEDULED,
          FightStatus.IN_PROGRESS,
        ],
      },
      scheduledAt: { lte: now },
    },
    data: { status: FightStatus.AWAITING_RESULT },
  });
}

export async function tryFinalizeFightFromResults(fightId: string) {
  const serverId = await getScopedServerId();
  const fight = await prisma.fight.findFirst({
    where: { id: fightId, serverId },
    include: { results: true },
  });

  if (
    !fight ||
    fight.status === FightStatus.COMPLETED ||
    fight.status === FightStatus.CANCELLED ||
    fight.status === FightStatus.REFUNDED
  ) {
    return;
  }

  if (fight.results.some((r) => r.type === FightResultType.DISPUTE)) {
    if (fight.status !== FightStatus.AWAITING_RECORDINGS && fight.status !== FightStatus.DISPUTED) {
      await prisma.fight.update({
        where: { id: fightId },
        data: { status: FightStatus.AWAITING_RECORDINGS },
      });
    }
    return;
  }

  const wins = fight.results.filter((r) => r.type === FightResultType.WIN);
  const losses = fight.results.filter((r) => r.type === FightResultType.LOSS);

  if (wins.length === 1 && losses.length === 1 && wins[0].reportedById !== losses[0].reportedById) {
    return { shouldPayout: true, winnerId: wins[0].reportedById };
  }

  if (fight.results.length > 0) {
    const blockedStatuses: FightStatus[] = [
      FightStatus.DISPUTED,
      FightStatus.AWAITING_RECORDINGS,
      FightStatus.COMPLETED,
    ];
    if (!blockedStatuses.includes(fight.status)) {
      const nextStatus =
        fight.scheduledAt <= new Date()
          ? FightStatus.AWAITING_RESULT
          : FightStatus.IN_PROGRESS;
      if (fight.status !== nextStatus) {
        await prisma.fight.update({
          where: { id: fightId },
          data: { status: nextStatus },
        });
      }
    }
  }

  return { shouldPayout: false, winnerId: null };
}
