import { getAdminActivityFeed, getAdminOverviewStats } from "@/server/queries/admin/overview";
import { getAdminAuditLog, getPlatformSettings } from "@/server/queries/admin/settings";
import { getAdminFights } from "@/server/queries/admin/fights";
import { getAdminUsers } from "@/server/queries/admin/users";
import {
  getAdminDepositRequests,
  getAdminWithdrawRequests,
} from "@/server/queries/admin/wallet-requests";
import { getAdminTransactions } from "@/server/queries/admin/transactions";
import { getAdminDisputes } from "@/server/queries/admin/disputes";
import { getScopedServerId } from "@/server/scope";

export async function getAdminDashboardData() {
  const serverId = await getScopedServerId();
  const [
    stats,
    activity,
    fights,
    users,
    depositRequests,
    withdrawRequests,
    transactions,
    disputes,
    auditLog,
    settings,
  ] = await Promise.all([
    getAdminOverviewStats(),
    getAdminActivityFeed(25),
    getAdminFights(),
    getAdminUsers(),
    getAdminDepositRequests(),
    getAdminWithdrawRequests(),
    getAdminTransactions(),
    getAdminDisputes(),
    getAdminAuditLog(),
    getPlatformSettings(serverId),
  ]);

  return {
    stats,
    activity,
    fights,
    users,
    depositRequests: depositRequests.map((d) => ({
      ...d,
      createdAt: d.createdAt.toISOString(),
      reviewedAt: d.reviewedAt?.toISOString() ?? null,
      updatedAt: d.updatedAt.toISOString(),
    })),
    withdrawRequests: withdrawRequests.map((w) => ({
      ...w,
      createdAt: w.createdAt.toISOString(),
      reviewedAt: w.reviewedAt?.toISOString() ?? null,
      updatedAt: w.updatedAt.toISOString(),
    })),
    transactions,
    disputes,
    auditLog: auditLog.map((a) => ({
      id: a.id,
      adminName: a.admin.minecraftUsername ?? a.admin.discordUsername,
      action: a.action,
      targetType: a.targetType,
      targetId: a.targetId,
      note: a.note,
      createdAt: a.createdAt.toISOString(),
    })),
    settings,
  };
}

export type AdminDashboardData = Awaited<ReturnType<typeof getAdminDashboardData>>;
