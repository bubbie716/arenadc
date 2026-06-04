"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { acceptFight, declineFight } from "@/actions/fights";
import { FightPrepRemindersModal } from "@/components/fight/FightPrepRemindersModal";
import { Button } from "@/components/ui/Button";
import { useFormatCurrency, useServerConfig } from "@/components/providers/ServerConfigProvider";

interface AcceptFightPanelProps {
  fightId: string;
  fightDisplayId: string;
  wagerAmount: number;
  canAccept: boolean;
  canDecline: boolean;
}

export function AcceptFightPanel({
  fightId,
  fightDisplayId,
  wagerAmount,
  canAccept,
  canDecline,
}: AcceptFightPanelProps) {
  const formatMoney = useFormatCurrency();
  const { currencyCode } = useServerConfig();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [prepModalOpen, setPrepModalOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function submitAccept() {
    startTransition(async () => {
      setError(null);
      const res = await acceptFight(fightId);
      if (!res.ok) {
        setPrepModalOpen(false);
        setError(res.error);
      } else {
        setPrepModalOpen(false);
        setMessage("Fight accepted. Wager escrowed.");
        router.refresh();
      }
    });
  }

  if (!canAccept && !canDecline) return null;

  return (
    <section className="mb-8 rounded-2xl border border-accent/30 bg-accent/5 p-6">
      <h2 className="text-xl font-bold">Respond to Challenge</h2>
      <p className="mt-2 text-sm text-muted">
        {wagerAmount === 0 ? (
          <>
            This is a <span className="font-bold text-foreground">free fight</span> — no {currencyCode}{" "}
            will be escrowed on accept.
          </>
        ) : (
          <>
            Matching wager required:{" "}
            <span className="font-bold text-foreground">{formatMoney(wagerAmount)}</span> will be
            escrowed from your wallet on accept.
          </>
        )}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        {canAccept && (
          <Button disabled={pending} onClick={() => setPrepModalOpen(true)}>
            Accept Fight
          </Button>
        )}
        {canDecline && (
          <Button
            variant="danger"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                const res = await declineFight(fightId);
                if (!res.ok) setError(res.error);
                else {
                  setMessage("Challenge declined.");
                  router.refresh();
                }
              })
            }
          >
            Decline
          </Button>
        )}
      </div>
      {message && <p className="mt-4 text-sm text-success">{message}</p>}
      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <FightPrepRemindersModal
        open={prepModalOpen}
        onClose={() => setPrepModalOpen(false)}
        onConfirm={submitAccept}
        confirmLabel="Accept Fight"
        pending={pending}
        context="accept"
        fightDisplayId={fightDisplayId}
        wagerAmount={wagerAmount}
      />
    </section>
  );
}
