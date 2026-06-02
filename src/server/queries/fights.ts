import { FightStatus as DbFightStatus, type Prisma } from "@prisma/client";
import { fightInclude, mapFightToUI } from "@/lib/mappers";
import {
  homepageCompletedVisibleSince,
  homepageFeedWhere,
  homepageFightWhere,
} from "@/lib/fight-statuses";
import { prisma } from "@/lib/prisma";
import { repairAllFightDisplayNumbers } from "@/server/fight-display";
import { syncPastScheduledFights } from "@/server/fight-status";
import type { Fight } from "@/lib/types";

async function loadFights(args: Prisma.FightFindManyArgs): Promise<Fight[]> {
  await syncPastScheduledFights();
  await repairAllFightDisplayNumbers();
  const fights = await prisma.fight.findMany({
    ...args,
    include: args.include ?? fightInclude,
  });
  return fights.map(mapFightToUI);
}

export async function getFightById(id: string): Promise<Fight | null> {
  await syncPastScheduledFights();
  await repairAllFightDisplayNumbers();
  const fight = await prisma.fight.findUnique({
    where: { id },
    include: fightInclude,
  });
  return fight ? mapFightToUI(fight) : null;
}

export async function getFightByIdRaw(id: string) {
  return prisma.fight.findUnique({
    where: { id },
    include: {
      ...fightInclude,
      createdBy: true,
      playerA: true,
      playerB: true,
    },
  });
}

export async function getFightsStartingSoon(limit = 4): Promise<Fight[]> {
  return loadFights({
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
  return loadFights({
    where: homepageFeedWhere(),
    include: fightInclude,
    orderBy: { wagerAmount: "desc" },
    take: limit,
  });
}

export async function getRecentResults(limit = 4): Promise<Fight[]> {
  return loadFights({
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
  const user = await prisma.user.findUnique({
    where: { minecraftUsername },
  });
  if (!user) return [];

  return loadFights({
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
  return loadFights({
    include: fightInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getFightCount(): Promise<number> {
  return prisma.fight.count();
}

export async function getPlatformStats() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [activeFighters, rmdWageredToday, fightsThisWeek, largestPot] = await Promise.all([
    prisma.user.count({ where: { minecraftUsername: { not: null } } }),
    prisma.fight.aggregate({
      where: {
        createdAt: { gte: startOfDay },
        status: { notIn: [DbFightStatus.DRAFT, DbFightStatus.PENDING_ACCEPTANCE, DbFightStatus.DECLINED] },
      },
      _sum: { wagerAmount: true },
    }),
    prisma.fight.count({
      where: {
        createdAt: { gte: weekAgo },
        status: { notIn: [DbFightStatus.DRAFT, DbFightStatus.PENDING_ACCEPTANCE] },
      },
    }),
    prisma.fight.findFirst({
      where: {
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
