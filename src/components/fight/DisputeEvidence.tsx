"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  adminResolveDispute,
  markDisputeUnderReview,
  reviewEvidenceSubmission,
  submitEvidenceLink,
} from "@/actions/evidence";
import { Button } from "@/components/ui/Button";
import type { EvidenceSubmission } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

interface DisputeEvidenceProps {
  fightId: string;
  playerALabel: string;
  playerBLabel: string;
  playerAId: string | null;
  playerBId: string | null;
  currentUserId: string | null;
  isAdmin: boolean;
  evidenceA: EvidenceSubmission | null;
  evidenceB: EvidenceSubmission | null;
}

function StatusBadge({ status }: { status: EvidenceSubmission["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold uppercase",
        status === "accepted" && "border-success/30 text-success",
        status === "rejected" && "border-danger/30 text-danger",
        status === "pending" && "border-warning/30 text-warning",
      )}
    >
      {status}
    </span>
  );
}

function EvidenceLinkCard({
  title,
  submission,
  canSubmit,
  fightId,
  onSubmitted,
}: {
  title: string;
  submission: EvidenceSubmission | null;
  canSubmit: boolean;
  fightId: string;
  onSubmitted: () => void;
}) {
  const [proofUrl, setProofUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      setError(null);
      const res = await submitEvidenceLink(fightId, proofUrl, notes);
      if (!res.ok) setError(res.error);
      else onSubmitted();
    });
  }

  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-5">
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted">{title}</h3>

      {submission ? (
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={submission.status} />
            <span className="text-muted">{formatDate(submission.createdAt)}</span>
          </div>
          <Link
            href={submission.proofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block break-all font-medium text-accent hover:underline"
          >
            {submission.proofUrl}
          </Link>
          {submission.notes && (
            <p className="rounded-lg bg-surface px-3 py-2 text-muted">{submission.notes}</p>
          )}
          {canSubmit && (
            <p className="text-xs text-muted">
              Your link is locked after submission and cannot be edited.
            </p>
          )}
        </div>
      ) : canSubmit ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label htmlFor={`proof-${title}`} className="text-xs font-medium text-muted">
              Proof URL
            </label>
            <input
              id={`proof-${title}`}
              type="url"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              required
            />
          </div>
          <div>
            <label htmlFor={`notes-${title}`} className="text-xs font-medium text-muted">
              Notes (optional)
            </label>
            <textarea
              id={`notes-${title}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Round timestamps, context, etc."
              rows={2}
              className="mt-1 w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
          </div>
          <Button type="submit" size="sm" disabled={pending}>
            Submit evidence link
          </Button>
          {error && <p className="text-sm text-danger">{error}</p>}
        </form>
      ) : (
        <p className="mt-4 text-sm text-muted">No submission yet.</p>
      )}
    </div>
  );
}

export function DisputeEvidence({
  fightId,
  playerALabel,
  playerBLabel,
  playerAId,
  playerBId,
  currentUserId,
  isAdmin,
  evidenceA,
  evidenceB,
}: DisputeEvidenceProps) {
  const router = useRouter();
  const [adminPending, startAdmin] = useTransition();

  const isFighter =
    Boolean(currentUserId) &&
    (currentUserId === playerAId || currentUserId === playerBId);

  if (!isFighter && !isAdmin) return null;

  return (
    <section className="mb-10 rounded-2xl border border-danger/25 bg-danger/5 p-6">
      <h2 className="text-xl font-bold">Submit Evidence Link</h2>
      <p className="mt-2 text-sm text-muted leading-relaxed">
        Both fighters must submit POV recording links within 15 minutes of a dispute. Missing,
        edited, or incomplete recordings may result in forfeiture.
      </p>
      <p className="mt-2 text-xs text-muted leading-relaxed">
        Paste a link to your POV recording or proof. YouTube, Medal, Streamable, Imgur, Google
        Drive, and Discord links are accepted. Each fighter may submit once — links cannot be
        changed after submission.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <EvidenceLinkCard
          title={`${playerALabel} Evidence`}
          submission={evidenceA}
          canSubmit={currentUserId === playerAId}
          fightId={fightId}
          onSubmitted={() => router.refresh()}
        />
        <EvidenceLinkCard
          title={`${playerBLabel} Evidence`}
          submission={evidenceB}
          canSubmit={currentUserId === playerBId}
          fightId={fightId}
          onSubmitted={() => router.refresh()}
        />
      </div>

      {isAdmin && (
        <div className="mt-8 border-t border-border/60 pt-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Admin review</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {evidenceA && (
              <>
                <Button
                  size="sm"
                  variant="success"
                  disabled={adminPending}
                  onClick={() =>
                    startAdmin(async () => {
                      await reviewEvidenceSubmission(evidenceA.id, "accept");
                      router.refresh();
                    })
                  }
                >
                  Accept A evidence
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={adminPending}
                  onClick={() =>
                    startAdmin(async () => {
                      await reviewEvidenceSubmission(evidenceA.id, "reject");
                      router.refresh();
                    })
                  }
                >
                  Reject A evidence
                </Button>
              </>
            )}
            {evidenceB && (
              <>
                <Button
                  size="sm"
                  variant="success"
                  disabled={adminPending}
                  onClick={() =>
                    startAdmin(async () => {
                      await reviewEvidenceSubmission(evidenceB.id, "accept");
                      router.refresh();
                    })
                  }
                >
                  Accept B evidence
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={adminPending}
                  onClick={() =>
                    startAdmin(async () => {
                      await reviewEvidenceSubmission(evidenceB.id, "reject");
                      router.refresh();
                    })
                  }
                >
                  Reject B evidence
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="secondary"
              disabled={adminPending}
              onClick={() =>
                startAdmin(async () => {
                  await markDisputeUnderReview(fightId);
                  router.refresh();
                })
              }
            >
              Mark under review
            </Button>
            <Button
              size="sm"
              variant="success"
              disabled={adminPending}
              onClick={() =>
                startAdmin(async () => {
                  await adminResolveDispute(fightId, "pay_a");
                  router.refresh();
                })
              }
            >
              Mark Player A winner
            </Button>
            <Button
              size="sm"
              variant="success"
              disabled={adminPending}
              onClick={() =>
                startAdmin(async () => {
                  await adminResolveDispute(fightId, "pay_b");
                  router.refresh();
                })
              }
            >
              Mark Player B winner
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={adminPending}
              onClick={() =>
                startAdmin(async () => {
                  await adminResolveDispute(fightId, "refund");
                  router.refresh();
                })
              }
            >
              Refund fight
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
