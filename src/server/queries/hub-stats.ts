import { SERVER_IDS, type ServerId } from "@/lib/server-config";
import { prisma } from "@/lib/prisma";

const ACTIVE_USER_DAYS = 30;

function activeUserSince(): Date {
  return new Date(Date.now() - ACTIVE_USER_DAYS * 24 * 60 * 60 * 1000);
}

export async function countActiveUsersForServer(serverId: ServerId): Promise<number> {
  const since = activeUserSince();
  return prisma.user.count({
    where: {
      serverId,
      minecraftUsername: { not: null },
      OR: [
        { createdFights: { some: { serverId, createdAt: { gte: since } } } },
        { fightsAsPlayerA: { some: { serverId, createdAt: { gte: since } } } },
        { fightsAsPlayerB: { some: { serverId, createdAt: { gte: since } } } },
      ],
    },
  });
}

export async function getHubActiveUserCounts(): Promise<Record<ServerId, number>> {
  const entries = await Promise.all(
    SERVER_IDS.map(async (id) => [id, await countActiveUsersForServer(id)] as const),
  );
  return Object.fromEntries(entries) as Record<ServerId, number>;
}
