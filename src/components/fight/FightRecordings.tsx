import Link from "next/link";
import type { EvidenceSubmission } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface FightRecordingsProps {
  playerALabel: string;
  playerBLabel: string;
  evidenceA: EvidenceSubmission | null;
  evidenceB: EvidenceSubmission | null;
}

function RecordingCard({
  fighterLabel,
  submission,
}: {
  fighterLabel: string;
  submission: EvidenceSubmission | null;
}) {
  return (
    <div className="flex min-h-[8.5rem] flex-col rounded-xl border border-border/80 bg-surface-elevated/90 p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">{fighterLabel}</p>
      {submission ? (
        <div className="mt-3 flex flex-1 flex-col justify-between gap-3">
          <Link
            href={submission.proofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent/20 transition hover:bg-accent/90"
          >
            Watch POV recording
          </Link>
          <div className="space-y-1 text-xs text-muted">
            <p className="break-all">{submission.proofUrl}</p>
            <p>Submitted {formatDate(submission.createdAt)}</p>
            {submission.notes && (
              <p className="rounded-lg bg-surface px-3 py-2 text-sm text-foreground/80">
                {submission.notes}
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">No recording submitted.</p>
      )}
    </div>
  );
}

export function FightRecordings({
  playerALabel,
  playerBLabel,
  evidenceA,
  evidenceB,
}: FightRecordingsProps) {
  if (!evidenceA && !evidenceB) return null;

  return (
    <section className="mb-10 overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 via-surface to-blue/5 p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-accent">Fight recordings</p>
          <h2 className="mt-1 text-xl font-bold sm:text-2xl">POV evidence</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Submitted POV links from this fight. Open a recording to review what happened.
          </p>
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <RecordingCard fighterLabel={playerALabel} submission={evidenceA} />
        <RecordingCard fighterLabel={playerBLabel} submission={evidenceB} />
      </div>
    </section>
  );
}
