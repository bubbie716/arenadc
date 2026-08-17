import { FightStatus as DbFightStatus, type Prisma } from "@prisma/client";
import { fightInclude, mapFightToUI } from "@/lib/mappers";
import {
  homepageCompletedVisibleSince,
  homepageFightWhere,
} from "@/lib/fight-statuses";
import { prisma } from "@/lib/prisma";
import { repairAllFightDisplayNumbers } from "@/server/fight-display";
import { getSpectatorPoolSummariesForFights } from "@/server/queries/spectator-betting";
import { syncPastScheduledFights } from "@/server/fight-status";
import { getScopedServerId } from "@/server/scope";
import type { Fight } from "@/lib/types";

async function loadFights(
  serverId: string,
  args: Prisma.FightFindManyArgs,
): Promise<Fight[]> {
  await syncPastScheduledFights();
  await repairAllFightDisplayNumbers();
  const fights = await prisma.fight.findMany({
    ...args,
    where: { serverId, ...(args.where as object) },
    include: args.include ?? fightInclude,
  });
  const mapped = fights.map(mapFightToUI);
  const pools = await getSpectatorPoolSummariesForFights(mapped.map((f) => f.id));
  return mapped.map((fight) => ({
    ...fight,
    spectatorPool: pools[fight.id],
  }));
}

export async function getFightById(id: string): Promise<Fight | null> {
  const serverId = await getScopedServerId();
  await syncPastScheduledFights();
  await repairAllFightDisplayNumbers();
  const fight = await prisma.fight.findFirst({
    where: { id, serverId },
    include: fightInclude,
  });
  return fight ? mapFightToUI(fight) : null;
}

export async function getFightByIdRaw(id: string) {
  const serverId = await getScopedServerId();
  return prisma.fight.findFirst({
    where: { id, serverId },
    include: {
      ...fightInclude,
      createdBy: true,
      playerA: true,
      playerB: true,
    },
  });
}

export async function getFightsStartingSoon(limit = 4): Promise<Fight[]> {
  const serverId = await getScopedServerId();
  return loadFights(serverId, {
    where: {
      AND: [
        homepageFightWhere(),
        {
          status: {
            notIn: [DbFightStatus.COMPLETED, DbFightStatus.CANCELLED, DbFightStatus.REFUNDED],
          },
        },
      ],
    },
    include: fightInclude,
    orderBy: { scheduledAt: "asc" },
    take: limit,
  });
}

export async function getBiggestPotFights(limit = 4): Promise<Fight[]> {
  const serverId = await getScopedServerId();
  return loadFights(serverId, {
    where: {
      AND: [
        homepageFightWhere(),
        {
          status: {
            notIn: [
              DbFightStatus.COMPLETED,
              DbFightStatus.CANCELLED,
              DbFightStatus.REFUNDED,
              DbFightStatus.DECLINED,
            ],
          },
        },
        { wagerAmount: { gt: 0 } },
      ],
    },
    include: fightInclude,
    orderBy: { wagerAmount: "desc" },
    take: limit,
  });
}

export async function getRecentResults(limit = 4): Promise<Fight[]> {
  const serverId = await getScopedServerId();
  return loadFights(serverId, {
    where: {
      status: DbFightStatus.COMPLETED,
      completedAt: { gte: homepageCompletedVisibleSince() },
    },
    include: fightInclude,
    orderBy: { completedAt: "desc" },
    take: limit,
  });
}

export async function getUserRecentFights(minecraftUsername: string, limit = 6) {
  const serverId = await getScopedServerId();
  const user = await prisma.user.findFirst({
    where: {
      serverId,
      minecraftUsername: { equals: minecraftUsername, mode: "insensitive" },
    },
  });
  if (!user) return [];

  return loadFights(serverId, {
    where: {
      OR: [
        { playerAId: user.id },
        { playerBId: user.id },
        { createdById: user.id },
        {
          status: DbFightStatus.PENDING_ACCEPTANCE,
          opponentMcName: { equals: minecraftUsername, mode: "insensitive" },
        },
      ],
    },
    include: fightInclude,
    orderBy: { scheduledAt: "desc" },
    take: limit,
  });
}

export async function getAllFightsForAdmin() {
  const serverId = await getScopedServerId();
  return loadFights(serverId, {
    include: fightInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getFightCount(): Promise<number> {
  const serverId = await getScopedServerId();
  return prisma.fight.count({ where: { serverId } });
}

export async function getPlatformStats() {
  const serverId = await getScopedServerId();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [activeFighters, rmdWageredToday, fightsThisWeek, largestPot] = await Promise.all([
    prisma.user.count({ where: { serverId, minecraftUsername: { not: null } } }),
    prisma.fight.aggregate({
      where: {
        serverId,
        createdAt: { gte: startOfDay },
        status: { notIn: [DbFightStatus.DRAFT, DbFightStatus.PENDING_ACCEPTANCE, DbFightStatus.DECLINED] },
      },
      _sum: { wagerAmount: true },
    }),
    prisma.fight.count({
      where: {
        serverId,
        createdAt: { gte: weekAgo },
        status: { notIn: [DbFightStatus.DRAFT, DbFightStatus.PENDING_ACCEPTANCE] },
      },
    }),
    prisma.fight.findFirst({
      where: {
        serverId,
        createdAt: { gte: startOfDay },
        ...homepageFightWhere(),
      },
      orderBy: { wagerAmount: "desc" },
      select: { wagerAmount: true },
    }),
  ]);

  return {
    activeFighters,
    rmdWageredToday: (rmdWageredToday._sum.wagerAmount ?? 0) * 2,
    fightsThisWeek,
    largestPotToday: (largestPot?.wagerAmount ?? 0) * 2,
  };
}
