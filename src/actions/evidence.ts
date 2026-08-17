"use server";

import { revalidatePath } from "next/cache";
import { EvidenceSubmissionStatus, FightStatus } from "@prisma/client";
import type { ActionResult } from "@/actions/fights";
import { normalizeProofUrl, validateProofUrl } from "@/lib/evidence-proof";
import { DISPUTE_EVIDENCE_STATUSES } from "@/lib/fight-statuses";
import { requireSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import type { ServerId } from "@/lib/server-config";
import { getScopedServerId } from "@/server/scope";
import {
  notifyEvidenceSubmitted,
  notifyFightResolved,
} from "@/server/notifications";

async function assertFighterEvidenceSubmit(
  fightId: string,
  userId: string,
  serverId: ServerId,
) {
  const fight = await prisma.fight.findFirst({
    where: { id: fightId, serverId },
    select: {
      playerAId: true,
      playerBId: true,
      status: true,
      fightNumber: true,
    },
  });

  if (!fight) return { ok: false as const, error: "Fight not found." };
  if (!DISPUTE_EVIDENCE_STATUSES.includes(fight.status)) {
    return { ok: false as const, error: "This fight is not accepting evidence." };
  }

  const isFighter = fight.playerAId === userId || fight.playerBId === userId;
  if (!isFighter) {
    return { ok: false as const, error: "Only fighters can submit evidence." };
  }

  return { ok: true as const, fight };
}

export async function submitEvidenceLink(
  fightId: string,
  proofUrl: string,
  notes?: string,
): Promise<ActionResult> {
  try {
    const user = await requireSessionUser();
    const serverId = await getScopedServerId();
    const access = await assertFighterEvidenceSubmit(fightId, user.id, serverId);
    if (!access.ok) return access;

    const fight = access.fight;

    const urlError = validateProofUrl(proofUrl);
    if (urlError) return { ok: false, error: urlError };

    const normalizedUrl = normalizeProofUrl(proofUrl);
    const trimmedNotes = notes?.trim() || null;

    const existing = await prisma.evidenceSubmission.findUnique({
      where: {
        fightId_uploaderId: { fightId, uploaderId: user.id },
      },
      select: { id: true },
    });
    if (existing) {
      return {
        ok: false,
        error: "Your recording link was already submitted and cannot be changed.",
      };
    }

    await prisma.evidenceSubmission.create({
      data: {
        serverId,
        fightId,
        uploaderId: user.id,
        proofUrl: normalizedUrl,
        notes: trimmedNotes,
        status: EvidenceSubmissionStatus.PENDING,
      },
    });

    const notifyIds = [fight.playerAId, fight.playerBId].filter(
      (id): id is string => Boolean(id) && id !== user.id,
    );
    if (notifyIds.length > 0) {
      await notifyEvidenceSubmitted({
        notifyUserIds: notifyIds,
        fightId,
        fightNumber: fight.fightNumber,
        submitterName: user.minecraftUsername ?? "A fighter",
      });
    }

    revalidatePath(`/fights/${fightId}`);
    revalidatePath("/admin");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not submit evidence link." };
  }
}

export async function reviewEvidenceSubmission(
  submissionId: string,
  decision: "accept" | "reject",
): Promise<ActionResult> {
  try {
    const user = await requireSessionUser();
    if (!user.isAdmin) return { ok: false, error: "Admin only." };

    const serverId = await getScopedServerId();
    const existing = await prisma.evidenceSubmission.findFirst({
      where: { id: submissionId, serverId },
      select: { id: true },
    });
    if (!existing) return { ok: false, error: "Submission not found." };

    const submission = await prisma.evidenceSubmission.update({
      where: { id: submissionId },
      data: {
        status:
          decision === "accept"
            ? EvidenceSubmissionStatus.ACCEPTED
            : EvidenceSubmissionStatus.REJECTED,
        reviewedAt: new Date(),
        reviewedById: user.id,
      },
      select: { fightId: true },
    });

    revalidatePath(`/fights/${submission.fightId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not review evidence." };
  }
}

export async function adminResolveDispute(
  fightId: string,
  action: "pay_a" | "pay_b" | "refund",
): Promise<ActionResult> {
  try {
    const user = await requireSessionUser();
    if (!user.isAdmin) return { ok: false, error: "Admin only." };

    const { adminUpdateFightStatus } = await import("@/actions/fights");
    const mapped =
      action === "pay_a" ? "pay_a" : action === "pay_b" ? "pay_b" : "refund";
    return adminUpdateFightStatus(fightId, mapped);
  } catch {
    return { ok: false, error: "Could not resolve dispute." };
  }
}

export async function markDisputeUnderReview(fightId: string): Promise<ActionResult> {
  try {
    const user = await requireSessionUser();
    if (!user.isAdmin) return { ok: false, error: "Admin only." };

    const serverId = await getScopedServerId();
    await prisma.fight.updateMany({
      where: { id: fightId, serverId },
      data: { status: FightStatus.DISPUTED },
    });

    const fight = await prisma.fight.findFirst({
      where: { id: fightId, serverId },
      select: { fightNumber: true, playerAId: true, playerBId: true },
    });
    if (fight?.playerAId && fight.playerBId) {
      await notifyFightResolved({
        userIds: [fight.playerAId, fight.playerBId],
        fightId,
        fightNumber: fight.fightNumber,
        summary: "Dispute moved to admin review.",
      });
    }

    revalidatePath(`/fights/${fightId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update fight." };
  }
}
