"use client";

import { useState, useTransition } from "react";
import { submitWithdrawalRequest } from "@/actions/wallet";
import { Button } from "@/components/ui/Button";
import { ModalSubmittingOverlay } from "@/components/wallet/ModalSubmittingOverlay";
import {
  useFormatCurrency,
  useServerConfig,
} from "@/components/providers/ServerConfigProvider";
import { getWithdrawInstructions } from "@/lib/server-rules/wallet-copy";

interface WithdrawRequestModalProps {
  open: boolean;
  defaultMinecraftUsername: string;
  availableBalance: number;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function WithdrawRequestModal({
  open,
  defaultMinecraftUsername,
  availableBalance,
  onClose,
  onSuccess,
  onError,
}: WithdrawRequestModalProps) {
  const formatMoney = useFormatCurrency();
  const config = useServerConfig();
  const withdrawCopy = getWithdrawInstructions(config);
  const [pending, startTransition] = useTransition();
  const [amount, setAmount] = useState("");
  const [minecraftUsername, setMinecraftUsername] = useState(defaultMinecraftUsername);

  if (!open) return null;

  function handleSubmit() {
    const parsed = Math.floor(Number(amount));
    if (!Number.isFinite(parsed) || parsed < 100) {
      onError(`Enter a valid amount (minimum 100 ${config.currencyCode}).`);
      return;
    }
    if (parsed > availableBalance) {
      onError(`Insufficient available balance (${formatMoney(availableBalance)}).`);
      return;
    }

    startTransition(async () => {
      const res = await submitWithdrawalRequest({
        amount: parsed,
        minecraftUsername: minecraftUsername.trim(),
      });
      if (!res.ok) {
        onError(res.error);
        return;
      }
      setAmount("");
      onClose();
      onSuccess(
        "Withdrawal requested. Your requested amount is locked while the withdrawal is pending.",
      );
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close"
        onClick={() => {
          if (pending) return;
          onClose();
        }}
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-surface-elevated p-6 shadow-2xl">
        {pending && (
          <ModalSubmittingOverlay message="Submitting withdrawal request…" />
        )}
        <h2 className="text-xl font-bold">Request withdrawal</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">{withdrawCopy.primary}</p>
        {withdrawCopy.helper ? (
          <p className="mt-2 text-xs text-muted">{withdrawCopy.helper}</p>
        ) : null}
        <p className="mt-2 text-sm font-semibold text-foreground">
          Available: {formatMoney(availableBalance)}
        </p>

        <label className="mt-6 block">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Amount ({config.currencyCode})
          </span>
          <input
            type="number"
            min={100}
            max={availableBalance}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Minecraft username
          </span>
          <input
            type="text"
            maxLength={16}
            value={minecraftUsername}
            onChange={(e) => setMinecraftUsername(e.target.value)}
            className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
          />
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" disabled={pending} onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={pending} onClick={handleSubmit}>
            Submit request
          </Button>
        </div>
      </div>
    </div>
  );
}
