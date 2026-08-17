import { getPlatformStats } from "@/server/queries/fights";
import { getTopFighter } from "@/server/queries/users";
import { fightInclude } from "@/lib/mappers";
import { homepageFightWhere } from "@/lib/fight-statuses";
import { prisma } from "@/lib/prisma";
import { FightStatus } from "@prisma/client";
import { getScopedServerId } from "@/server/scope";
import type { Rivalry, TrendingFighter } from "@/lib/types";

export async function getFeaturedRivalry(): Promise<Rivalry | null> {
  const serverId = await getScopedServerId();
  const fight = await prisma.fight.findFirst({
    where: {
      serverId,
      ...homepageFightWhere(),
      playerBId: { not: null },
      status: {
        in: [
          FightStatus.CONFIRMED,
          FightStatus.SCHEDULED,
          FightStatus.IN_PROGRESS,
          FightStatus.AWAITING_RESULT,
        ],
      },
    },
    orderBy: { wagerAmount: "desc" },
    include: fightInclude,
  });

  if (!fight?.playerA?.minecraftUsername || !fight.playerB?.minecraftUsername) {
    return null;
  }

  return {
    playerA: fight.playerA.minecraftUsername,
    playerB: fight.playerB.minecraftUsername,
    seriesRecord: { a: 0, b: 0 },
    nextFightId: fight.id,
    nextFightLabel: fight.scheduledAt.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

export async function getHomePageData() {
  const serverId = await getScopedServerId();
  const [platformStats, trendingFighter, rivalry, rankedFighters] = await Promise.all([
    getPlatformStats(),
    getTopFighter(),
    getFeaturedRivalry(),
    prisma.user
      .findMany({
        where: { serverId, minecraftUsername: { not: null } },
        orderBy: { walletBalance: "desc" },
        take: 5,
        select: { minecraftUsername: true },
      })
      .then((u) => u.map((x) => x.minecraftUsername!)),
  ]);

  return {
    platformStats,
    trendingFighter: trendingFighter as TrendingFighter | null,
    rivalry,
    rankedFighters,
    rivalries: rivalry ? [rivalry] : [],
  };
}
