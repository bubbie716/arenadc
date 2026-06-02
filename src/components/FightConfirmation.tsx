"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { reportFightResult } from "@/actions/fights";
import { Button } from "@/components/ui/Button";

export type FightResultReport = "won" | "lost" | "dispute";

interface FightConfirmationProps {
  fightId: string;
  existingReport?: FightResultReport | null;
  isFreeFight?: boolean;
}

function reportLabels(isFreeFight: boolean): Record<FightResultReport, string> {
  return {
    won: "You reported a win. Waiting for opponent confirmation.",
    lost: "You reported a loss.",
    dispute: isFreeFight
      ? "Free fight disputed — this counts as an automatic loss on your record. Your opponent gets the win."
      : "You opened a dispute. Submit POV proof links within 15 minutes.",
  };
}

const LOCKED_LABELS: Record<FightResultReport, string> = {
  won: "I Won",
  lost: "I Lost",
  dispute: "Dispute",
};

export function FightConfirmation({
  fightId,
  existingReport,
  isFreeFight = false,
}: FightConfirmationProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lockedReport, setLockedReport] = useState<FightResultReport | null>(
    existingReport ?? null,
  );
  const labels = reportLabels(isFreeFight);

  function handleAction(action: FightResultReport) {
    if (lockedReport) return;

    startTransition(async () => {
      setError(null);
      const res = await reportFightResult(fightId, action);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setLockedReport(action);
      setMessage(labels[action]);
      router.refresh();
    });
  }

  if (lockedReport) {
    return (
      <section className="mb-8 rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-xl font-bold">Result Confirmation</h2>
        <p className="mt-4 rounded-lg bg-surface-elevated px-4 py-3 text-sm text-muted">
          <span className="font-semibold text-foreground">{LOCKED_LABELS[lockedReport]}</span>
          {" — locked in. "}
          {labels[lockedReport]}
        </p>
      </section>
    );
  }

  return (
    <section className="mb-8 rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/5 to-surface p-6 transition-all hover:border-accent/40">
      <h2 className="text-xl font-bold">Result Confirmation</h2>
      <p className="mt-2 text-sm text-muted">
        {isFreeFight
          ? "Report your result honestly. Your choice is final once submitted. Disputing a free fight counts as an automatic loss."
          : "Report your result honestly. Your choice is final once submitted. Instant payout when both fighters agree."}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="success" disabled={pending} onClick={() => handleAction("won")}>
          I Won
        </Button>
        <Button variant="secondary" disabled={pending} onClick={() => handleAction("lost")}>
          I Lost
        </Button>
        <Button variant="danger" disabled={pending} onClick={() => handleAction("dispute")}>
          Dispute
        </Button>
      </div>
      {message && (
        <p className="mt-4 rounded-lg bg-surface-elevated px-4 py-3 text-sm text-muted">
          {message}
        </p>
      )}
      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
    </section>
  );
}
