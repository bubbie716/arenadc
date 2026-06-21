"use server";

import { revalidatePath } from "next/cache";
import { FightStatus } from "@prisma/client";
import { adminErrorMessage, type ActionResult } from "@/actions/admin/_result";
import { AdminAuditAction, logAdminAction } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/auth";
import { requireAdminNote } from "@/lib/admin/notes";
import { formatFightDisplayId } from "@/lib/fight-display";
import { prisma } from "@/lib/prisma";
import { getScopedServerId } from "@/server/scope";
import { payoutFightWinner, refundFightEscrow } from "@/server/fight-payout";
import { refundSpectatorPool } from "@/server/spectator-betting";
import { notifyFightResolved } from "@/server/notifications";

export type AdminFightAction =
  | "cancel"
  | "pay_a"
  | "pay_b"
  | "refund"
  | "dispute"
  | "resolve";

export async function adminFightAction(
  fightId: string,
  action: AdminFightAction,
  note: string,
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const adminNote = requireAdminNote(note);
    const serverId = await getScopedServerId();

    const fight = await prisma.fight.findFirst({
      where: { id: fightId, serverId },
    });
    if (!fight) return { ok: false, error: "Fight not found." };

    const displayId = formatFightDisplayId(serverId, fight.fightNumber);
    const fighterIds = [fight.playerAId, fight.playerBId].filter(
      (id): id is string => Boolean(id),
    );

    if (action === "dispute") {
      await prisma.fight.update({
        where: { id: fightId },
        data: { status: FightStatus.AWAITING_RECORDINGS },
      });
      await logAdminAction({
        adminId: admin.id,
        action: AdminAuditAction.FIGHT_DISPUTED,
        targetType: "fight",
        targetId: fightId,
        note: adminNote,
        metadata: { displayId },
      });
    } else if (action === "cancel") {
      if (
        fight.status === FightStatus.COMPLETED ||
        fight.status === FightStatus.REFUNDED
      ) {
        return { ok: false, error: "Fight is already settled." };
      }
      await prisma.fight.update({
        where: { id: fightId },
        data: { status: FightStatus.CANCELLED },
      });
      await refundSpectatorPool(fightId).catch(() => {});
      await logAdminAction({
        adminId: admin.id,
        action: AdminAuditAction.FIGHT_CANCELLED,
        targetType: "fight",
        targetId: fightId,
        note: adminNote,
        metadata: { displayId },
      });
    } else if (action === "refund") {
      await refundFightEscrow(fightId, admin.id);
      const updated = await prisma.fight.findFirst({
        where: { id: fightId, serverId },
      });
      if (updated?.status !== FightStatus.REFUNDED) {
        await prisma.fight.update({
          where: { id: fightId },
          data: { status: FightStatus.REFUNDED },
        });
      }
      if (fighterIds.length > 0) {
        await notifyFightResolved({
          userIds: fighterIds,
          fightId,
          fightNumber: fight.fightNumber,
          summary: "Fight refunded by admin.",
        });
      }
      await logAdminAction({
        adminId: admin.id,
        action: AdminAuditAction.FIGHT_REFUNDED,
        targetType: "fight",
        targetId: fightId,
        note: adminNote,
        metadata: { displayId },
      });
    } else if (action === "pay_a" || action === "pay_b") {
      const winnerId = action === "pay_a" ? fight.playerAId : fight.playerBId;
      if (!winnerId) return { ok: false, error: "Fighter not set." };
      await payoutFightWinner(fightId, winnerId, {
        resolvedSummary: "Admin resolved dispute.",
        adminId: admin.id,
      });
      await logAdminAction({
        adminId: admin.id,
        action: AdminAuditAction.FIGHT_FORCE_PAYOUT,
        targetType: "fight",
        targetId: fightId,
        note: adminNote,
        metadata: { displayId, winnerId },
      });
    } else if (action === "resolve") {
      await prisma.fight.update({
        where: { id: fightId },
        data: { status: FightStatus.COMPLETED, completedAt: new Date() },
      });
      await logAdminAction({
        adminId: admin.id,
        action: AdminAuditAction.FIGHT_RESOLVED,
        targetType: "fight",
        targetId: fightId,
        note: adminNote,
        metadata: { displayId },
      });
    }

    revalidatePath("/admin");
    revalidatePath(`/fights/${fightId}`);
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: adminErrorMessage(e) };
  }
}
