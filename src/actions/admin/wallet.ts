"use server";

import { revalidatePath } from "next/cache";
import {
  DepositRequestStatus,
  WalletTransactionType,
  WithdrawRequestStatus,
} from "@prisma/client";
import { adminErrorMessage, type ActionResult } from "@/actions/admin/_result";
import { AdminAuditAction, logAdminAction } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/auth";
import { requireAdminNote, optionalAdminNote } from "@/lib/admin/notes";
import { postLedgerEntry } from "@/lib/wallet/ledger";
import { getActiveServerConfig } from "@/lib/server-context";
import { prisma } from "@/lib/prisma";
import { getScopedServerId } from "@/server/scope";
import {
  notifyDepositApproved,
  notifyDepositRejected,
  notifyWithdrawalPaid,
  notifyWithdrawalRejected,
} from "@/server/notifications/wallet";

export async function adminApproveDeposit(
  requestId: string,
  note: string,
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const adminNote = optionalAdminNote(note);
    const serverId = await getScopedServerId();
    const config = await getActiveServerConfig();

    const deposit = await prisma.$transaction(async (tx) => {
      const req = await tx.depositRequest.findFirst({
        where: { id: requestId, serverId },
        include: { user: { select: { id: true } } },
      });
      if (!req) throw new Error("Request not found.");
      if (req.status !== DepositRequestStatus.PENDING) {
        throw new Error("ALREADY_PROCESSED");
      }
      if (req.userId === admin.id && !admin.isAdmin) {
        throw new Error("FORBIDDEN");
      }

      await postLedgerEntry(tx, {
        userId: req.userId,
        type: WalletTransactionType.DEPOSIT,
        amount: req.amount,
        description: `${config.currencyCode} deposit (admin approved)`,
        createdById: admin.id,
        depositRequestId: req.id,
      });

      return tx.depositRequest.update({
        where: { id: requestId },
        data: {
          status: DepositRequestStatus.APPROVED,
          adminNote,
          reviewedById: admin.id,
          reviewedAt: new Date(),
        },
      });
    });

    await logAdminAction({
      adminId: admin.id,
      action: AdminAuditAction.DEPOSIT_APPROVED,
      targetType: "deposit_request",
      targetId: requestId,
      note: adminNote,
    });

    await notifyDepositApproved(deposit.userId, deposit.amount);

    revalidatePath("/admin");
    revalidatePath("/wallet");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: adminErrorMessage(e) };
  }
}

export async function adminRejectDeposit(
  requestId: string,
  note: string,
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const adminNote = requireAdminNote(note);
    const serverId = await getScopedServerId();

    const deposit = await prisma.depositRequest.updateMany({
      where: { id: requestId, serverId, status: DepositRequestStatus.PENDING },
      data: {
        status: DepositRequestStatus.REJECTED,
        adminNote,
        reviewedById: admin.id,
        reviewedAt: new Date(),
      },
    });
    if (deposit.count === 0) {
      return { ok: false, error: "Request not found or already processed." };
    }

    const req = await prisma.depositRequest.findFirstOrThrow({
      where: { id: requestId, serverId },
    });

    await logAdminAction({
      adminId: admin.id,
      action: AdminAuditAction.DEPOSIT_REJECTED,
      targetType: "deposit_request",
      targetId: requestId,
      note: adminNote,
    });

    await notifyDepositRejected(req.userId, req.amount, adminNote);

    revalidatePath("/admin");
    revalidatePath("/wallet");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: adminErrorMessage(e) };
  }
}

export async function adminMarkWithdrawalPaid(
  requestId: string,
  note: string,
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const adminNote = optionalAdminNote(note);
    const serverId = await getScopedServerId();

    const req = await prisma.$transaction(async (tx) => {
      const row = await tx.withdrawRequest.findFirst({
        where: { id: requestId, serverId },
      });
      if (!row) throw new Error("Request not found.");
      if (row.status !== WithdrawRequestStatus.PENDING) {
        throw new Error("ALREADY_PROCESSED");
      }

      const lockTx = await tx.walletTransaction.findFirst({
        where: {
          serverId,
          withdrawRequestId: requestId,
          type: WalletTransactionType.WITHDRAWAL_LOCK,
        },
      });
      if (!lockTx) {
        throw new Error("Missing withdrawal lock transaction.");
      }

      await tx.walletTransaction.create({
        data: {
          serverId,
          userId: row.userId,
          type: WalletTransactionType.WITHDRAWAL_PAID,
          amount: 0,
          description: `Withdrawal paid in-game to ${row.minecraftUsername}`,
          createdById: admin.id,
          withdrawRequestId: row.id,
        },
      });

      return tx.withdrawRequest.update({
        where: { id: requestId },
        data: {
          status: WithdrawRequestStatus.PAID,
          adminNote,
          reviewedById: admin.id,
          reviewedAt: new Date(),
        },
      });
    });

    await logAdminAction({
      adminId: admin.id,
      action: AdminAuditAction.WITHDRAWAL_PAID,
      targetType: "withdraw_request",
      targetId: requestId,
      note: adminNote,
    });

    await notifyWithdrawalPaid(req.userId, req.amount, req.minecraftUsername);

    revalidatePath("/admin");
    revalidatePath("/wallet");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: adminErrorMessage(e) };
  }
}

export async function adminRejectWithdrawal(
  requestId: string,
  note: string,
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const adminNote = requireAdminNote(note);
    const serverId = await getScopedServerId();

    const req = await prisma.$transaction(async (tx) => {
      const row = await tx.withdrawRequest.findFirst({
        where: { id: requestId, serverId },
      });
      if (!row) throw new Error("Request not found.");
      if (row.status !== WithdrawRequestStatus.PENDING) {
        throw new Error("ALREADY_PROCESSED");
      }

      await postLedgerEntry(tx, {
        userId: row.userId,
        type: WalletTransactionType.WITHDRAWAL_RELEASE,
        amount: row.amount,
        description: "Withdrawal rejected — funds released",
        createdById: admin.id,
        withdrawRequestId: row.id,
      });

      return tx.withdrawRequest.update({
        where: { id: requestId },
        data: {
          status: WithdrawRequestStatus.REJECTED,
          adminNote,
          reviewedById: admin.id,
          reviewedAt: new Date(),
        },
      });
    });

    await logAdminAction({
      adminId: admin.id,
      action: AdminAuditAction.WITHDRAWAL_REJECTED,
      targetType: "withdraw_request",
      targetId: requestId,
      note: adminNote,
    });

    await notifyWithdrawalRejected(req.userId, req.amount, adminNote);

    revalidatePath("/admin");
    revalidatePath("/wallet");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: adminErrorMessage(e) };
  }
}
