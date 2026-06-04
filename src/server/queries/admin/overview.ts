import { DepositRequestStatus, EscrowStatus, FightStatus, WithdrawRequestStatus } from "@prisma/client";
import { getActiveServerConfig } from "@/lib/server-context";
import type { AdminActivityItem, AdminOverviewStats } from "@/lib/admin/types";
import { formatCurrency } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { getPlatformFeePercent } from "@/server/platform-settings";
import { getScopedServerId } from "@/server/scope";

const ACTIVE_USER_DAYS = 30;

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const serverId = await getScopedServerId();
  const weekAgo = new Date(Date.now() - ACTIVE_USER_DAYS * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsers,
    totalFights,
    confirmedFights,
    completedFights,
    disputedFights,
    refundedFights,
    wagerAgg,
    escrowAgg,
    completedWagerAgg,
    pendingDeposits,
    pendingWithdrawals,
    platformFeePercent,
  ] = await Promise.all([
    prisma.user.count({ where: { serverId } }),
    prisma.user.count({
      where: {
        serverId,
        minecraftUsername: { not: null },
        OR: [
          { createdFights: { some: { serverId, createdAt: { gte: weekAgo } } } },
          { fightsAsPlayerA: { some: { serverId, createdAt: { gte: weekAgo } } } },
          { fightsAsPlayerB: { some: { serverId, createdAt: { gte: weekAgo } } } },
        ],
      },
    }),
    prisma.fight.count({ where: { serverId } }),
    prisma.fight.count({
      where: {
        serverId,
        status: {
          in: [
            FightStatus.CONFIRMED,
            FightStatus.SCHEDULED,
            FightStatus.IN_PROGRESS,
            FightStatus.AWAITING_RESULT,
          ],
        },
      },
    }),
    prisma.fight.count({ where: { serverId, status: FightStatus.COMPLETED } }),
    prisma.fight.count({
      where: {
        serverId,
        status: {
          in: [FightStatus.DISPUTED, FightStatus.AWAITING_RECORDINGS],
        },
      },
    }),
    prisma.fight.count({ where: { serverId, status: FightStatus.REFUNDED } }),
    prisma.fight.aggregate({
      where: {
        serverId,
        status: { notIn: [FightStatus.DRAFT, FightStatus.DECLINED] },
        wagerAmount: { gt: 0 },
      },
      _sum: { wagerAmount: true },
    }),
    prisma.escrow.aggregate({
      where: { status: EscrowStatus.LOCKED, fight: { serverId } },
      _sum: { amount: true },
    }),
    prisma.fight.aggregate({
      where: { serverId, status: FightStatus.COMPLETED, wagerAmount: { gt: 0 } },
      _sum: { wagerAmount: true },
    }),
    prisma.depositRequest.count({
      where: { serverId, status: DepositRequestStatus.PENDING },
    }),
    prisma.withdrawRequest.count({
      where: { serverId, status: WithdrawRequestStatus.PENDING },
    }),
    getPlatformFeePercent(),
  ]);

  const totalWageredSides = wagerAgg._sum.wagerAmount ?? 0;
  const completedWagerSides = completedWagerAgg._sum.wagerAmount ?? 0;
  const totalPots = completedWagerSides * 2;
  const totalPlatformFees = Math.floor(totalPots * (platformFeePercent / 100));

  return {
    totalUsers,
    activeUsers,
    totalFights,
    confirmedFights,
    completedFights,
    disputedFights,
    refundedFights,
    totalRmdWagered: totalWageredSides * 2,
    totalRmdInEscrow: escrowAgg._sum.amount ?? 0,
    totalPlatformFees,
    pendingDeposits,
    pendingWithdrawals,
  };
}

export async function getAdminActivityFeed(limit = 20): Promise<AdminActivityItem[]> {
  const serverId = await getScopedServerId();
  const [fights, deposits, withdrawals, audits] = await Promise.all([
    prisma.fight.findMany({
      where: { serverId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        fightNumber: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        playerA: { select: { minecraftUsername: true } },
        playerB: { select: { minecraftUsername: true } },
        createdBy: { select: { minecraftUsername: true } },
      },
    }),
    prisma.depositRequest.findMany({
      where: { serverId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: { select: { minecraftUsername: true } } },
    }),
    prisma.withdrawRequest.findMany({
      where: { serverId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: { select: { minecraftUsername: true } } },
    }),
    prisma.adminAuditLog.findMany({
      where: { serverId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { admin: { select: { discordUsername: true } } },
    }),
  ]);

  const items: AdminActivityItem[] = [];

  for (const f of fights) {
    const code = `Fight-${String(f.fightNumber).padStart(4, "0")}`;
    const fighters = `${f.playerA?.minecraftUsername ?? "?"} vs ${f.playerB?.minecraftUsername ?? "TBD"}`;
    let kind = "fight.created";
    let message = `${code} created — ${fighters}`;
    if (f.status === FightStatus.COMPLETED) {
      kind = "fight.completed";
      message = `${code} completed — ${fighters}`;
    } else if (
      f.status === FightStatus.DISPUTED ||
      f.status === FightStatus.AWAITING_RECORDINGS
    ) {
      kind = "fight.disputed";
      message = `${code} disputed — ${fighters}`;
    } else if (f.status === FightStatus.OPEN || f.status === FightStatus.PENDING_ACCEPTANCE) {
      kind = "fight.created";
    } else if (
      f.status === FightStatus.CONFIRMED ||
      f.status === FightStatus.SCHEDULED
    ) {
      kind = "fight.accepted";
      message = `${code} accepted — ${fighters}`;
    }
    items.push({
      id: `fight-${f.id}-${f.createdAt.toISOString()}`,
      kind,
      message,
      createdAt: f.updatedAt.toISOString(),
      href: `/fights/${f.id}`,
    });
  }

  const config = await getActiveServerConfig();
  const fmt = (amount: number) => formatCurrency(amount, config);

  for (const d of deposits) {
    const user = d.user.minecraftUsername ?? "User";
    items.push({
      id: `deposit-${d.id}`,
      kind: `deposit.${d.status.toLowerCase()}`,
      message:
        d.status === DepositRequestStatus.PENDING
          ? `Deposit requested — ${user} · ${fmt(d.amount)}`
          : `Deposit ${d.status.toLowerCase()} — ${user} · ${fmt(d.amount)}`,
      createdAt: (d.reviewedAt ?? d.createdAt).toISOString(),
    });
  }

  for (const w of withdrawals) {
    const user = w.user.minecraftUsername ?? "User";
    items.push({
      id: `withdraw-${w.id}`,
      kind: `withdrawal.${w.status.toLowerCase()}`,
      message:
        w.status === WithdrawRequestStatus.PENDING
          ? `Withdrawal requested — ${user} · ${fmt(w.amount)}`
          : `Withdrawal ${w.status.toLowerCase()} — ${user} · ${fmt(w.amount)}`,
      createdAt: (w.reviewedAt ?? w.createdAt).toISOString(),
    });
  }

  for (const a of audits) {
    items.push({
      id: `audit-${a.id}`,
      kind: "admin.action",
      message: `${a.admin.discordUsername}: ${a.action.replace(/\./g, " ")}`,
      createdAt: a.createdAt.toISOString(),
    });
  }

  return items
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
