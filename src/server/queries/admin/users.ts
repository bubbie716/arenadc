import { EscrowStatus, FightStatus, WithdrawRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AdminUserRow = {
  id: string;
  minecraftUsername: string | null;
  discordUsername: string;
  walletBalance: number;
  escrowBalance: number;
  pendingWithdrawals: number;
  totalWagered: number;
  totalEarnings: number;
  wins: number;
  losses: number;
  disputesCount: number;
  joinedAt: string;
  isAdmin: boolean;
  walletFrozen: boolean;
  suspended: boolean;
};

export async function getAdminUsers(): Promise<AdminUserRow[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      minecraftUsername: true,
      discordUsername: true,
      walletBalance: true,
      isAdmin: true,
      walletFrozen: true,
      suspendedAt: true,
      createdAt: true,
    },
  });

  const userIds = users.map((u) => u.id);

  const [escrowByUser, pendingWithdrawByUser, payoutByUser, winsByUser, wageredByUser] =
    await Promise.all([
      prisma.escrow.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds }, status: EscrowStatus.LOCKED },
        _sum: { amount: true },
      }),
      prisma.withdrawRequest.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds }, status: WithdrawRequestStatus.PENDING },
        _sum: { amount: true },
      }),
      prisma.walletTransaction.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds }, type: "PAYOUT" },
        _sum: { amount: true },
      }),
      prisma.fight.groupBy({
        by: ["winnerId"],
        where: { winnerId: { in: userIds }, status: FightStatus.COMPLETED },
        _count: { id: true },
      }),
      prisma.escrow.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds } },
        _sum: { amount: true },
      }),
    ]);

  const escrowMap = new Map(escrowByUser.map((e) => [e.userId, e._sum.amount ?? 0]));
  const withdrawMap = new Map(pendingWithdrawByUser.map((w) => [w.userId, w._sum.amount ?? 0]));
  const payoutMap = new Map(payoutByUser.map((p) => [p.userId, p._sum.amount ?? 0]));
  const winsMap = new Map(
    winsByUser.filter((w) => w.winnerId).map((w) => [w.winnerId!, w._count.id]),
  );

  const lostFights = await prisma.fight.findMany({
    where: {
      status: FightStatus.COMPLETED,
      wagerAmount: { gt: 0 },
      OR: [{ playerAId: { in: userIds } }, { playerBId: { in: userIds } }],
    },
    select: { playerAId: true, playerBId: true, winnerId: true },
  });
  const lossMap = new Map<string, number>();
  for (const f of lostFights) {
    for (const uid of [f.playerAId, f.playerBId]) {
      if (!uid || f.winnerId === uid) continue;
      lossMap.set(uid, (lossMap.get(uid) ?? 0) + 1);
    }
  }

  const disputeFights = await prisma.fight.findMany({
    where: {
      status: { in: [FightStatus.DISPUTED, FightStatus.AWAITING_RECORDINGS] },
      OR: [{ playerAId: { in: userIds } }, { playerBId: { in: userIds } }],
    },
    select: { playerAId: true, playerBId: true },
  });
  const disputeMap = new Map<string, number>();
  for (const f of disputeFights) {
    for (const uid of [f.playerAId, f.playerBId]) {
      if (!uid) continue;
      disputeMap.set(uid, (disputeMap.get(uid) ?? 0) + 1);
    }
  }

  const wagerMap = new Map(wageredByUser.map((w) => [w.userId, w._sum.amount ?? 0]));

  return users.map((user) => ({
    id: user.id,
    minecraftUsername: user.minecraftUsername,
    discordUsername: user.discordUsername,
    walletBalance: user.walletBalance,
    escrowBalance: escrowMap.get(user.id) ?? 0,
    pendingWithdrawals: withdrawMap.get(user.id) ?? 0,
    totalWagered: wagerMap.get(user.id) ?? 0,
    totalEarnings: payoutMap.get(user.id) ?? 0,
    wins: winsMap.get(user.id) ?? 0,
    losses: lossMap.get(user.id) ?? 0,
    disputesCount: disputeMap.get(user.id) ?? 0,
    joinedAt: user.createdAt.toISOString(),
    isAdmin: user.isAdmin,
    walletFrozen: user.walletFrozen,
    suspended: Boolean(user.suspendedAt),
  }));
}

export async function getAdminUserDetail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      minecraftUsername: true,
      discordUsername: true,
      avatarUrl: true,
      walletBalance: true,
      walletFrozen: true,
      suspendedAt: true,
      isAdmin: true,
      createdAt: true,
    },
  });
  if (!user) return null;

  const [escrowTotal, recentFights, recentTx, deposits, withdrawals, auditNotes] =
    await Promise.all([
      prisma.escrow.aggregate({
        where: { userId, status: EscrowStatus.LOCKED },
        _sum: { amount: true },
      }),
      prisma.fight.findMany({
        where: {
          OR: [{ playerAId: userId }, { playerBId: userId }, { createdById: userId }],
        },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          playerA: { select: { minecraftUsername: true } },
          playerB: { select: { minecraftUsername: true } },
          createdBy: { select: { minecraftUsername: true } },
        },
      }),
      prisma.walletTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
      prisma.depositRequest.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.withdrawRequest.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.adminAuditLog.findMany({
        where: { targetType: "user", targetId: userId },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { admin: { select: { discordUsername: true } } },
      }),
    ]);

  const disputeFights = await prisma.fight.findMany({
    where: {
      status: { in: [FightStatus.DISPUTED, FightStatus.AWAITING_RECORDINGS] },
      OR: [{ playerAId: userId }, { playerBId: userId }],
    },
    include: {
      playerA: { select: { minecraftUsername: true } },
      playerB: { select: { minecraftUsername: true } },
    },
    take: 10,
  });

  return {
    user: {
      ...user,
      suspended: Boolean(user.suspendedAt),
      joinedAt: user.createdAt.toISOString(),
      escrowBalance: escrowTotal._sum.amount ?? 0,
    },
    recentFights: recentFights.map((f) => ({
      id: f.id,
      fightNumber: f.fightNumber,
      status: f.status,
      wagerAmount: f.wagerAmount,
      playerA: f.playerA?.minecraftUsername ?? f.createdBy.minecraftUsername,
      playerB: f.playerB?.minecraftUsername ?? f.opponentMcName,
    })),
    recentTransactions: recentTx.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      description: t.description,
      createdAt: t.createdAt.toISOString(),
      fightId: t.fightId,
    })),
    depositRequests: deposits,
    withdrawRequests: withdrawals,
    disputes: disputeFights,
    adminNotes: auditNotes.map((a) => ({
      id: a.id,
      action: a.action,
      note: a.note,
      admin: a.admin.discordUsername,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}
