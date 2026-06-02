import { prisma } from "@/lib/prisma";

export async function getAdminDepositRequests() {
  return prisma.depositRequest.findMany({
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
  return prisma.withdrawRequest.findMany({
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
