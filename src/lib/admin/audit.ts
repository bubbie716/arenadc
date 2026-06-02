import { prisma } from "@/lib/prisma";

export const AdminAuditAction = {
  DEPOSIT_APPROVED: "deposit.approved",
  DEPOSIT_REJECTED: "deposit.rejected",
  WITHDRAWAL_PAID: "withdrawal.paid",
  WITHDRAWAL_REJECTED: "withdrawal.rejected",
  FIGHT_CANCELLED: "fight.cancelled",
  FIGHT_REFUNDED: "fight.refunded",
  FIGHT_DISPUTED: "fight.disputed",
  FIGHT_FORCE_PAYOUT: "fight.force_payout",
  FIGHT_RESOLVED: "fight.resolved",
  EVIDENCE_ACCEPTED: "evidence.accepted",
  EVIDENCE_REJECTED: "evidence.rejected",
  USER_SUSPENDED: "user.suspended",
  USER_UNSUSPENDED: "user.unsuspended",
  USER_WALLET_FROZEN: "user.wallet_frozen",
  USER_WALLET_UNFROZEN: "user.wallet_unfrozen",
  USER_ADMIN_GRANTED: "user.admin_granted",
  USER_ADMIN_REVOKED: "user.admin_revoked",
  USER_BALANCE_ADJUSTMENT: "user.balance_adjustment",
  SETTINGS_UPDATED: "settings.updated",
} as const;

export type AdminAuditActionType =
  (typeof AdminAuditAction)[keyof typeof AdminAuditAction];

export async function logAdminAction(params: {
  adminId: string;
  action: AdminAuditActionType | string;
  targetType: string;
  targetId?: string | null;
  note?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await prisma.adminAuditLog.create({
    data: {
      adminId: params.adminId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId ?? null,
      note: params.note?.trim() || null,
      metadataJson: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });
}
