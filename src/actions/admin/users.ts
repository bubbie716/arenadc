"use server";

import { revalidatePath } from "next/cache";
import { WalletTransactionType } from "@prisma/client";
import { adminErrorMessage, type ActionResult } from "@/actions/admin/_result";
import { AdminAuditAction, logAdminAction } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/auth";
import { requireAdminNote } from "@/lib/admin/notes";
import { postLedgerEntry } from "@/lib/wallet/ledger";
import { prisma } from "@/lib/prisma";

export async function adminSetWalletFrozen(
  userId: string,
  frozen: boolean,
  note: string,
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const adminNote = requireAdminNote(note);

    await prisma.user.update({
      where: { id: userId },
      data: { walletFrozen: frozen },
    });

    await logAdminAction({
      adminId: admin.id,
      action: frozen
        ? AdminAuditAction.USER_WALLET_FROZEN
        : AdminAuditAction.USER_WALLET_UNFROZEN,
      targetType: "user",
      targetId: userId,
      note: adminNote,
    });

    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: adminErrorMessage(e) };
  }
}

export async function adminSetUserSuspended(
  userId: string,
  suspended: boolean,
  note: string,
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const adminNote = requireAdminNote(note);

    if (userId === admin.id && suspended) {
      return { ok: false, error: "You cannot suspend your own account." };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { suspendedAt: suspended ? new Date() : null },
    });

    await logAdminAction({
      adminId: admin.id,
      action: suspended
        ? AdminAuditAction.USER_SUSPENDED
        : AdminAuditAction.USER_UNSUSPENDED,
      targetType: "user",
      targetId: userId,
      note: adminNote,
    });

    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: adminErrorMessage(e) };
  }
}

export async function adminSetUserAdmin(
  userId: string,
  isAdmin: boolean,
  note: string,
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const adminNote = requireAdminNote(note);

    if (userId === admin.id && !isAdmin) {
      return { ok: false, error: "You cannot remove your own admin role." };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isAdmin },
    });

    await logAdminAction({
      adminId: admin.id,
      action: isAdmin
        ? AdminAuditAction.USER_ADMIN_GRANTED
        : AdminAuditAction.USER_ADMIN_REVOKED,
      targetType: "user",
      targetId: userId,
      note: adminNote,
    });

    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: adminErrorMessage(e) };
  }
}

export async function adminAdjustUserBalance(
  userId: string,
  amount: number,
  note: string,
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const adminNote = requireAdminNote(note);

    if (!Number.isFinite(amount) || amount === 0) {
      return { ok: false, error: "Enter a non-zero adjustment amount." };
    }
    if (Math.abs(amount) > 10_000_000) {
      return { ok: false, error: "Adjustment exceeds maximum allowed." };
    }

    await prisma.$transaction(async (tx) => {
      await postLedgerEntry(tx, {
        userId,
        type: WalletTransactionType.ADMIN_ADJUSTMENT,
        amount,
        description: `Admin adjustment: ${adminNote}`,
        createdById: admin.id,
      });
    });

    await logAdminAction({
      adminId: admin.id,
      action: AdminAuditAction.USER_BALANCE_ADJUSTMENT,
      targetType: "user",
      targetId: userId,
      note: adminNote,
      metadata: { amount },
    });

    revalidatePath("/admin");
    revalidatePath("/wallet");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: adminErrorMessage(e) };
  }
}
