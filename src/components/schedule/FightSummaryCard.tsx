"use client";

import { calculatePot } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useFormatCurrency, useServerConfig } from "@/components/providers/ServerConfigProvider";

interface FightSummaryCardProps {
  wager: number;
  platformFeePercent: number;
  opponentLabel: string;
  rulesetLabel: string;
  formatLabel: string;
  fightLocation: string;
  exceedsBalance?: boolean;
  walletBalance: number;
}

export function FightSummaryCard({
  wager,
  platformFeePercent,
  opponentLabel,
  rulesetLabel,
  formatLabel,
  fightLocation,
  exceedsBalance,
  walletBalance,
}: FightSummaryCardProps) {
  const formatMoney = useFormatCurrency();
  const { currencyCode } = useServerConfig();
  const isFree = wager === 0;
  const pot = calculatePot(wager, platformFeePercent);

  return (
    <Card className="sticky top-24 border-accent/30 glow-accent overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-accent/8 via-transparent to-blue/5 pointer-events-none" />
      <CardHeader className="relative border-b border-border/50">
        <CardTitle className="text-lg">Fight Summary</CardTitle>
        <p className="text-xs text-muted">
          {isFree ? "Free fight · No escrow" : "Equal wagers · Escrow on accept"}
        </p>
      </CardHeader>
      <CardContent className="relative space-y-4 pt-2">
        <div className="rounded-2xl border border-accent/40 bg-accent/5 px-5 py-6 text-center glow-pot">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">Total Pot</p>
          <p className="mt-2 text-4xl font-black tabular-nums tracking-tight text-gradient-accent sm:text-5xl">
            {isFree ? "Free" : formatMoney(pot.totalPot)}
          </p>
          <p className="mt-2 text-xs text-muted">
            {isFree
              ? `No ${currencyCode} wager — for practice or honor fights`
              : `${formatMoney(wager)} per fighter · ${platformFeePercent}% platform fee`}
          </p>
        </div>

        <dl className="space-y-2 text-sm">
          {(
            [
              { label: "Opponent", value: opponentLabel },
              { label: "Kit", value: rulesetLabel },
              { label: "Format", value: formatLabel },
              {
                label: "Fight Location",
                sublabel: "(In-game Coordinates)",
                value: fightLocation,
              },
            ] as const
          ).map((item) => (
            <div key={item.label} className="flex justify-between border-b border-border/40 pb-2">
              <dt className="text-muted">
                {item.label}
                {"sublabel" in item && item.sublabel ? (
                  <span className="block text-[11px] font-normal text-muted/80">
                    {item.sublabel}
                  </span>
                ) : null}
              </dt>
              <dd className="max-w-[55%] truncate text-right font-medium">{item.value}</dd>
            </div>
          ))}
        </dl>

        {!isFree && (
          <div className="space-y-2.5 rounded-xl border border-border/80 bg-surface-elevated/80 p-4">
            <div className="flex items-end justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-success">Winner Receives</p>
              <p className="text-2xl font-black text-success tabular-nums">
                {formatMoney(pot.winnerPayout)}
              </p>
            </div>
            <div className="flex items-center justify-between text-sm">
              <p className="text-muted">Platform Fee</p>
              <p className="font-semibold text-muted tabular-nums">−{formatMoney(pot.platformFee)}</p>
            </div>
          </div>
        )}

        {exceedsBalance && (
          <p
            className={cn(
              "rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning",
            )}
          >
            Wager exceeds available balance ({formatMoney(walletBalance)}). Deposit more {currencyCode}{" "}
            or lower your stake.
          </p>
        )}

        <p className="text-[11px] text-muted">Scheduling is free. No spectator betting in V1.</p>
      </CardContent>
    </Card>
  );
}
