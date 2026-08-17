"use server";

import { revalidatePath } from "next/cache";
import { WalletTransactionType } from "@prisma/client";
import { adminErrorMessage, type ActionResult } from "@/actions/admin/_result";
import { AdminAuditAction, logAdminAction } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/auth";
import { requireAdminNote } from "@/lib/admin/notes";
import { postLedgerEntry } from "@/lib/wallet/ledger";
import { prisma } from "@/lib/prisma";
import { getScopedServerId } from "@/server/scope";
import {
  notifyAccountSuspended,
  notifyAccountUnsuspended,
  notifyAdminBalanceAdjustment,
  notifyWalletFrozen,
  notifyWalletUnfrozen,
} from "@/server/notifications/account";

export async function adminSetWalletFrozen(
  userId: string,
  frozen: boolean,
  note: string,
  options?: { silent?: boolean },
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const adminNote = requireAdminNote(note);
    const serverId = await getScopedServerId();

    const updated = await prisma.user.updateMany({
      where: { id: userId, serverId },
      data: { walletFrozen: frozen },
    });
    if (updated.count === 0) {
      return { ok: false, error: "User not found." };
    }

    await logAdminAction({
      adminId: admin.id,
      action: frozen
        ? AdminAuditAction.USER_WALLET_FROZEN
        : AdminAuditAction.USER_WALLET_UNFROZEN,
      targetType: "user",
      targetId: userId,
      note: adminNote,
      metadata: options?.silent ? { silent: true } : undefined,
    });

    if (frozen) {
      await notifyWalletFrozen(userId, { silent: options?.silent });
    } else {
      await notifyWalletUnfrozen(userId, { silent: options?.silent });
    }

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
  options?: { silent?: boolean },
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const adminNote = requireAdminNote(note);
    const serverId = await getScopedServerId();

    if (userId === admin.id && suspended) {
      return { ok: false, error: "You cannot suspend your own account." };
    }

    const updated = await prisma.user.updateMany({
      where: { id: userId, serverId },
      data: { suspendedAt: suspended ? new Date() : null },
    });
    if (updated.count === 0) {
      return { ok: false, error: "User not found." };
    }

    await logAdminAction({
      adminId: admin.id,
      action: suspended
        ? AdminAuditAction.USER_SUSPENDED
        : AdminAuditAction.USER_UNSUSPENDED,
      targetType: "user",
      targetId: userId,
      note: adminNote,
      metadata: options?.silent ? { silent: true } : undefined,
    });

    if (suspended) {
      await notifyAccountSuspended(userId, { silent: options?.silent });
    } else {
      await notifyAccountUnsuspended(userId, { silent: options?.silent });
    }

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
    const serverId = await getScopedServerId();

    if (userId === admin.id && !isAdmin) {
      return { ok: false, error: "You cannot remove your own admin role." };
    }

    const updated = await prisma.user.updateMany({
      where: { id: userId, serverId },
      data: { isAdmin },
    });
    if (updated.count === 0) {
      return { ok: false, error: "User not found." };
    }

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
  options?: { silent?: boolean },
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const adminNote = requireAdminNote(note);
    const serverId = await getScopedServerId();

    const target = await prisma.user.findFirst({
      where: { id: userId, serverId },
      select: { id: true },
    });
    if (!target) {
      return { ok: false, error: "User not found." };
    }

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
      metadata: { amount, ...(options?.silent ? { silent: true } : {}) },
    });

    await notifyAdminBalanceAdjustment(userId, amount, { silent: options?.silent });

    revalidatePath("/admin");
    revalidatePath("/wallet");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: adminErrorMessage(e) };
  }
}

export async function adminSetNotificationsMuted(
  userId: string,
  muted: boolean,
  note: string,
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const adminNote = requireAdminNote(note);
    const serverId = await getScopedServerId();

    const updated = await prisma.user.updateMany({
      where: { id: userId, serverId },
      data: { notificationsMuted: muted },
    });
    if (updated.count === 0) {
      return { ok: false, error: "User not found." };
    }

    await logAdminAction({
      adminId: admin.id,
      action: muted
        ? AdminAuditAction.USER_NOTIFICATIONS_MUTED
        : AdminAuditAction.USER_NOTIFICATIONS_UNMUTED,
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

export async function adminSetMinecraftUsername(
  userId: string,
  username: string,
  note: string,
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const adminNote = requireAdminNote(note);
    const serverId = await getScopedServerId();

    const trimmed = username.trim();
    if (!trimmed || trimmed.length > 16) {
      return { ok: false, error: "Enter a valid Minecraft username (1–16 characters)." };
    }

    const target = await prisma.user.findFirst({
      where: { id: userId, serverId },
      select: { id: true, minecraftUsername: true },
    });
    if (!target) {
      return { ok: false, error: "User not found." };
    }

    if (target.minecraftUsername?.toLowerCase() === trimmed.toLowerCase()) {
      return { ok: false, error: "That is already this user's Minecraft username." };
    }

    const existing = await prisma.user.findFirst({
      where: {
        serverId,
        minecraftUsername: { equals: trimmed, mode: "insensitive" },
        NOT: { id: userId },
      },
      select: { id: true },
    });
    if (existing) {
      return { ok: false, error: "That Minecraft username is already linked to another account." };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { minecraftUsername: trimmed },
    });

    await logAdminAction({
      adminId: admin.id,
      action: AdminAuditAction.USER_MINECRAFT_USERNAME_CHANGED,
      targetType: "user",
      targetId: userId,
      note: adminNote,
      metadata: {
        previousUsername: target.minecraftUsername,
        newUsername: trimmed,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/profile");
    revalidatePath("/schedule");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: adminErrorMessage(e) };
  }
}
