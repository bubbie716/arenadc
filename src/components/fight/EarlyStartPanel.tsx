"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { agreeToStartFightEarly } from "@/actions/fights";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface EarlyStartPanelProps {
  fightId: string;
  playerA: string;
  playerB: string;
  playerAId: string;
  playerBId: string;
  currentUserId: string;
  earlyStartPlayerAAt: string | null;
  earlyStartPlayerBAt: string | null;
}

function AgreementRow({
  name,
  agreed,
  isSelf,
}: {
  name: string;
  agreed: boolean;
  isSelf: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-surface-elevated px-3 py-2 text-sm">
      <span className="font-medium">
        {name}
        {isSelf ? " (you)" : ""}
      </span>
      <span
        className={cn(
          "text-xs font-bold uppercase tracking-wide",
          agreed ? "text-success" : "text-muted",
        )}
      >
        {agreed ? "Ready" : "Waiting"}
      </span>
    </div>
  );
}

export function EarlyStartPanel({
  fightId,
  playerA,
  playerB,
  playerAId,
  playerBId,
  currentUserId,
  earlyStartPlayerAAt,
  earlyStartPlayerBAt,
}: EarlyStartPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isPlayerA = currentUserId === playerAId;
  const selfAgreed = isPlayerA ? Boolean(earlyStartPlayerAAt) : Boolean(earlyStartPlayerBAt);
  const opponentAgreed = isPlayerA ? Boolean(earlyStartPlayerBAt) : Boolean(earlyStartPlayerAAt);

  function handleAgree() {
    startTransition(async () => {
      setError(null);
      const res = await agreeToStartFightEarly(fightId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setMessage(
        opponentAgreed
          ? "Both fighters agreed — the fight is live."
          : "You agreed to start early. Waiting for your opponent.",
      );
      router.refresh();
    });
  }

  return (
    <section className="mb-8 rounded-2xl border border-accent/30 bg-accent/5 p-6">
      <h2 className="text-xl font-bold">Start Early</h2>
      <p className="mt-2 text-sm text-muted">
        Both fighters must agree before the scheduled time to begin early. Once both agree, the fight
        goes live and result reporting unlocks.
      </p>

      <div className="mt-4 space-y-2">
        <AgreementRow name={playerA} agreed={Boolean(earlyStartPlayerAAt)} isSelf={isPlayerA} />
        <AgreementRow name={playerB} agreed={Boolean(earlyStartPlayerBAt)} isSelf={!isPlayerA} />
      </div>

      {!selfAgreed && (
        <Button className="mt-6" disabled={pending} onClick={handleAgree}>
          Agree to Start Early
        </Button>
      )}

      {selfAgreed && !opponentAgreed && (
        <p className="mt-6 rounded-lg bg-surface-elevated px-4 py-3 text-sm text-muted">
          You agreed to start early. Waiting for your opponent.
        </p>
      )}

      {message && <p className="mt-4 text-sm text-success">{message}</p>}
      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
    </section>
  );
}
