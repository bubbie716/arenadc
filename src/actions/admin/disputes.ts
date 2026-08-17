"use server";

import { revalidatePath } from "next/cache";
import { EvidenceSubmissionStatus } from "@prisma/client";
import { adminFightAction } from "@/actions/admin/fights";
import { adminErrorMessage, type ActionResult } from "@/actions/admin/_result";
import { AdminAuditAction, logAdminAction } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/auth";
import { requireAdminNote } from "@/lib/admin/notes";
import { prisma } from "@/lib/prisma";
import { getScopedServerId } from "@/server/scope";

export async function adminReviewEvidence(
  submissionId: string,
  decision: "accept" | "reject",
  note: string,
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const adminNote = requireAdminNote(note);
    const serverId = await getScopedServerId();

    const submission = await prisma.evidenceSubmission.findFirst({
      where: { id: submissionId, serverId },
    });
    if (!submission) return { ok: false, error: "Submission not found." };

    await prisma.evidenceSubmission.update({
      where: { id: submissionId },
      data: {
        status:
          decision === "accept"
            ? EvidenceSubmissionStatus.ACCEPTED
            : EvidenceSubmissionStatus.REJECTED,
        reviewedAt: new Date(),
        reviewedById: admin.id,
      },
    });

    await logAdminAction({
      adminId: admin.id,
      action:
        decision === "accept"
          ? AdminAuditAction.EVIDENCE_ACCEPTED
          : AdminAuditAction.EVIDENCE_REJECTED,
      targetType: "evidence",
      targetId: submissionId,
      note: adminNote,
      metadata: { fightId: submission.fightId },
    });

    revalidatePath("/admin");
    revalidatePath(`/fights/${submission.fightId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: adminErrorMessage(e) };
  }
}

export async function adminResolveDispute(
  fightId: string,
  action: "pay_a" | "pay_b" | "refund" | "resolve",
  note: string,
): Promise<ActionResult> {
  if (action === "resolve") {
    return adminFightAction(fightId, "resolve", note);
  }
  const mapped = action === "pay_a" ? "pay_a" : action === "pay_b" ? "pay_b" : "refund";
  return adminFightAction(fightId, mapped, note);
}
