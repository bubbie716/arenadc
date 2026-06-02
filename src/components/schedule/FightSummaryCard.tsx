import { PLATFORM_FEE_PERCENT } from "@/lib/constants";
import { calculatePot, formatRmd } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FightSummaryCardProps {
  wager: number;
  opponentLabel: string;
  rulesetLabel: string;
  formatLabel: string;
  fightLocation: string;
  exceedsBalance?: boolean;
  walletBalance: number;
}

export function FightSummaryCard({
  wager,
  opponentLabel,
  rulesetLabel,
  formatLabel,
  fightLocation,
  exceedsBalance,
  walletBalance,
}: FightSummaryCardProps) {
  const isFree = wager === 0;
  const pot = calculatePot(wager);

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
            {isFree ? "Free" : formatRmd(pot.totalPot)}
          </p>
          <p className="mt-2 text-xs text-muted">
            {isFree
              ? "No RMD wager — for practice or honor fights"
              : `${formatRmd(wager)} per fighter · ${PLATFORM_FEE_PERCENT}% platform fee`}
          </p>
        </div>

        <dl className="space-y-2 text-sm">
          {[
            ["Opponent", opponentLabel],
            ["Ruleset", rulesetLabel],
            ["Format", formatLabel],
            ["Fight Location", fightLocation],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-border/40 pb-2">
              <dt className="text-muted">{k}</dt>
              <dd className="max-w-[55%] truncate text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>

        {!isFree && (
          <div className="space-y-2.5 rounded-xl border border-border/80 bg-surface-elevated/80 p-4">
            <div className="flex items-end justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-success">Winner Receives</p>
              <p className="text-2xl font-black text-success tabular-nums">
                {formatRmd(pot.winnerPayout)}
              </p>
            </div>
            <div className="flex items-center justify-between text-sm">
              <p className="text-muted">Platform Fee</p>
              <p className="font-semibold text-muted tabular-nums">−{formatRmd(pot.platformFee)}</p>
            </div>
          </div>
        )}

        {exceedsBalance && (
          <p
            className={cn(
              "rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning",
            )}
          >
            Wager exceeds available balance ({formatRmd(walletBalance)}). Deposit more RMD or
            lower your stake.
          </p>
        )}

        <p className="text-[11px] text-muted">Scheduling is free. No spectator betting in V1.</p>
      </CardContent>
    </Card>
  );
}
