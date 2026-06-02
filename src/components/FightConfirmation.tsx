"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { reportFightResult } from "@/actions/fights";
import { Button } from "@/components/ui/Button";

interface FightConfirmationProps {
  fightId: string;
}

export function FightConfirmation({ fightId }: FightConfirmationProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleAction(action: "won" | "lost" | "dispute") {
    startTransition(async () => {
      setError(null);
      const res = await reportFightResult(fightId, action);
      if (!res.ok) setError(res.error);
      else {
        const labels = {
          won: "You reported a win. Waiting for opponent confirmation.",
          lost: "You reported a loss.",
          dispute: "Dispute opened. Submit POV proof links within 15 minutes.",
        };
        setMessage(labels[action]);
        router.refresh();
      }
    });
  }

  return (
    <section className="mb-8 rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/5 to-surface p-6 transition-all hover:border-accent/40">
      <h2 className="text-xl font-bold">Result Confirmation</h2>
      <p className="mt-2 text-sm text-muted">
        Report your result honestly. Instant payout when both fighters agree.
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
