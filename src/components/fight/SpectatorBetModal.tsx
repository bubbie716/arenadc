"use client";

import { useMemo, useState, useTransition } from "react";
import { placeSpectatorBet } from "@/actions/spectator-bets";
import { Button } from "@/components/ui/Button";
import {
  useFormatCurrency,
  useServerConfig,
} from "@/components/providers/ServerConfigProvider";
import type { SpectatorPoolSummary } from "@/lib/types";
import { previewSpectatorPayoutForSide } from "@/lib/spectator-betting/parimutuel";

interface SpectatorBetModalProps {
  open: boolean;
  onClose: () => void;
  pool: SpectatorPoolSummary;
  side: "a" | "b";
  walletBalance: number;
  onSuccess: () => void;
}

export function SpectatorBetModal({
  open,
  onClose,
  pool,
  side,
  walletBalance,
  onSuccess,
}: SpectatorBetModalProps) {
  const formatMoney = useFormatCurrency();
  const config = useServerConfig();
  const [amountInput, setAmountInput] = useState("1000");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const fighterName = side === "a" ? pool.playerAName : pool.playerBName;
  const fighterId = side === "a" ? pool.playerAId : pool.playerBId;
  const amount = Number.parseInt(amountInput, 10) || 0;

  const estimatedPayout = useMemo(() => {
    if (amount < 100) return 0;
    return previewSpectatorPayoutForSide(pool, side, amount);
  }, [amount, pool, side]);

  if (!open) return null;

  function submit() {
    startTransition(async () => {
      setError(null);
      const res = await placeSpectatorBet({
        fightId: pool.fightId,
        selectedFighterId: fighterId,
        amount,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onSuccess();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <h3 className="text-lg font-bold">Predict on {fighterName}</h3>
        <p className="mt-2 text-sm text-muted">
          Prediction pools use in-game currency only. Payouts are based on final pool sizes and
          are not fixed odds.
        </p>

        <label className="mt-5 block text-sm font-medium">
          Amount ({config.currencyCode})
          <input
            type="text"
            inputMode="numeric"
            value={amountInput}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw !== "" && !/^\d+$/.test(raw)) return;
              setAmountInput(raw);
            }}
            className="mt-2 w-full rounded-xl border border-border bg-surface-elevated px-4 py-3"
            autoComplete="off"
          />
        </label>

        <div className="mt-4 space-y-1 text-sm text-muted">
          <p>
            Available balance:{" "}
            <span className="font-semibold text-foreground">
              {formatMoney(walletBalance)}
            </span>
          </p>
          <p>
            Estimated payout if {fighterName} wins:{" "}
            <span className="font-semibold text-accent">
              {amount >= 100 ? formatMoney(estimatedPayout) : "—"}
            </span>
          </p>
          <p className="text-xs">
            Estimated payout changes as more users bet. Includes your stake if you win.
          </p>
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
        )}

        <div className="mt-6 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            disabled={pending || amount < 100 || amount > walletBalance}
            onClick={submit}
          >
            Confirm Prediction
          </Button>
        </div>
      </div>
    </div>
  );
}
