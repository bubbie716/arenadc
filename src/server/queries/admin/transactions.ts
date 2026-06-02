import { prisma } from "@/lib/prisma";

export type AdminTransactionRow = {
  id: string;
  userId: string;
  userLabel: string;
  type: string;
  amount: number;
  fightId: string | null;
  fightLabel: string | null;
  createdAt: string;
  createdByLabel: string | null;
  description: string;
};

export async function getAdminTransactions(limit = 300): Promise<AdminTransactionRow[]> {
  const rows = await prisma.walletTransaction.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { minecraftUsername: true, discordUsername: true } },
      fight: { select: { fightNumber: true } },
    },
  });

  const adminIds = [...new Set(rows.map((r) => r.createdById).filter(Boolean))] as string[];
  const admins =
    adminIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: adminIds } },
          select: { id: true, discordUsername: true },
        })
      : [];
  const adminMap = new Map(admins.map((a) => [a.id, a.discordUsername]));

  return rows.map((t) => ({
    id: t.id,
    userId: t.userId,
    userLabel: t.user.minecraftUsername ?? t.user.discordUsername,
    type: t.type,
    amount: t.amount,
    fightId: t.fightId,
    fightLabel: t.fight
      ? `Fight-${String(t.fight.fightNumber).padStart(4, "0")}`
      : null,
    createdAt: t.createdAt.toISOString(),
    createdByLabel: t.createdById ? (adminMap.get(t.createdById) ?? "Admin") : null,
    description: t.description,
  }));
}
