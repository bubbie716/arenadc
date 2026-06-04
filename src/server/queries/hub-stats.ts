import { FightStatus as DbFightStatus } from "@prisma/client";
import { homepageFightWhere } from "@/lib/fight-statuses";
import { SERVER_IDS, type ServerId } from "@/lib/server-config";
import { prisma } from "@/lib/prisma";

export type HubServerPulseStats = {
  signedUpUsers: number;
  largestPotToday: number;
};

function startOfToday(): Date {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
}

export async function getHubServerPulseStats(
  serverId: ServerId,
): Promise<HubServerPulseStats> {
  const startOfDay = startOfToday();

  const [signedUpUsers, largestPot] = await Promise.all([
    prisma.user.count({
      where: { serverId, minecraftUsername: { not: null } },
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
    signedUpUsers,
    largestPotToday: (largestPot?.wagerAmount ?? 0) * 2,
  };
}

export async function getHubServerPulseStatsAll(): Promise<
  Record<ServerId, HubServerPulseStats>
> {
  const entries = await Promise.all(
    SERVER_IDS.map(async (id) => [id, await getHubServerPulseStats(id)] as const),
  );
  return Object.fromEntries(entries) as Record<ServerId, HubServerPulseStats>;
}
