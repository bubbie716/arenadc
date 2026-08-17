"use server";

import { revalidatePath } from "next/cache";
import { adminErrorMessage, type ActionResult } from "@/actions/admin/_result";
import { AdminAuditAction, logAdminAction } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/auth";
import { requireAdminNote } from "@/lib/admin/notes";
import { formatFightDisplayId } from "@/lib/fight-display";
import { prisma } from "@/lib/prisma";
import {
  lockSpectatorBettingMarket,
  refundSpectatorPool,
  ensureSpectatorPoolSettled,
} from "@/server/spectator-betting";
import { getScopedServerId } from "@/server/scope";

export async function adminLockSpectatorPool(
  fightId: string,
  note: string,
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const adminNote = requireAdminNote(note);
    const serverId = await getScopedServerId();

    const fight = await prisma.fight.findFirst({
      where: { id: fightId, serverId },
      select: { fightNumber: true, spectatorBettingEnabled: true },
    });
    if (!fight?.spectatorBettingEnabled) {
      return { ok: false, error: "Spectator betting not enabled for this fight." };
    }

    await lockSpectatorBettingMarket(fightId);

    await logAdminAction({
      adminId: admin.id,
      action: AdminAuditAction.SPECTATOR_POOL_LOCKED,
      targetType: "fight",
      targetId: fightId,
      note: adminNote,
      metadata: { displayId: formatFightDisplayId(serverId, fight.fightNumber) },
    });

    revalidatePath("/admin");
    revalidatePath(`/fights/${fightId}`);
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: adminErrorMessage(e) };
  }
}

export async function adminRefundSpectatorPool(
  fightId: string,
  note: string,
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const adminNote = requireAdminNote(note);
    const serverId = await getScopedServerId();

    const fight = await prisma.fight.findFirst({
      where: { id: fightId, serverId },
      select: { fightNumber: true, spectatorBettingEnabled: true },
    });
    if (!fight?.spectatorBettingEnabled) {
      return { ok: false, error: "Spectator betting not enabled for this fight." };
    }

    await refundSpectatorPool(fightId, "Prediction pool refunded by admin.");

    await logAdminAction({
      adminId: admin.id,
      action: AdminAuditAction.SPECTATOR_POOL_REFUNDED,
      targetType: "fight",
      targetId: fightId,
      note: adminNote,
      metadata: { displayId: formatFightDisplayId(serverId, fight.fightNumber) },
    });

    revalidatePath("/admin");
    revalidatePath(`/fights/${fightId}`);
    revalidatePath("/wallet");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: adminErrorMessage(e) };
  }
}

export async function adminSettleSpectatorPool(
  fightId: string,
  note: string,
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const adminNote = requireAdminNote(note);
    const serverId = await getScopedServerId();

    const fight = await prisma.fight.findFirst({
      where: { id: fightId, serverId },
      select: {
        fightNumber: true,
        spectatorBettingEnabled: true,
        winnerId: true,
      },
    });

    if (!fight?.spectatorBettingEnabled) {
      return { ok: false, error: "Spectator betting not enabled for this fight." };
    }
    if (!fight.winnerId) {
      return { ok: false, error: "Fight winner must be finalized before settling the pool." };
    }

    await ensureSpectatorPoolSettled(fightId, fight.winnerId, { adminId: admin.id });

    await logAdminAction({
      adminId: admin.id,
      action: AdminAuditAction.SPECTATOR_POOL_SETTLED,
      targetType: "fight",
      targetId: fightId,
      note: adminNote,
      metadata: { displayId: formatFightDisplayId(serverId, fight.fightNumber) },
    });

    revalidatePath("/admin");
    revalidatePath(`/fights/${fightId}`);
    revalidatePath("/wallet");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    if (code === "SINGLE_SIDED_POOL") {
      return {
        ok: false,
        error: "Cannot settle a single-sided pool. Refund the pool instead.",
      };
    }
    return { ok: false, error: adminErrorMessage(e) };
  }
}
