import { prisma } from "@/lib/prisma";
import { getScopedServerId } from "@/server/scope";

export async function getAdminDepositRequests() {
  const serverId = await getScopedServerId();
  return prisma.depositRequest.findMany({
    where: { serverId },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: {
        select: { id: true, minecraftUsername: true, discordUsername: true },
      },
      reviewedBy: { select: { discordUsername: true } },
    },
  });
}

export async function getAdminWithdrawRequests() {
  const serverId = await getScopedServerId();
  return prisma.withdrawRequest.findMany({
    where: { serverId },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: {
        select: { id: true, minecraftUsername: true, discordUsername: true },
      },
      reviewedBy: { select: { discordUsername: true } },
    },
  });
}
