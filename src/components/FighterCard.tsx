"use client";

import type { FighterStats } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useFormatCurrency } from "@/components/providers/ServerConfigProvider";
import { MinecraftHead } from "./MinecraftHead";
import { StreakDisplay } from "./StreakDisplay";

interface FighterCardProps {
  username: string;
  stats: FighterStats;
  wagerAmount?: number;
  isWinner?: boolean;
}

export function FighterCard({
  username,
  stats,
  wagerAmount,
  isWinner,
}: FighterCardProps) {
  const formatMoney = useFormatCurrency();
  const isTbd = username === "TBD";

  return (
    <div
      className={cn(
        "card-interactive rounded-2xl border bg-surface-elevated p-6 transition-all duration-300",
        isWinner
          ? "border-success/50 glow-accent"
          : "border-border hover:border-accent/30",
      )}
    >
      <div className="flex items-start gap-5">
        <div className="rounded-2xl border border-border bg-surface p-2 shadow-md">
          <MinecraftHead username={username} size={72} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xl font-black">{username}</h3>
          {isWinner && (
            <span className="mt-1 inline-block text-xs font-bold uppercase tracking-wide text-success">
              ✓ Winner
            </span>
          )}
          {wagerAmount !== undefined && (
            <p className="mt-2 text-sm text-muted">
              Wager: <span className="font-bold text-foreground">{formatMoney(wagerAmount)}</span>
            </p>
          )}
          {isTbd ? (
            <p className="mt-3 text-sm text-muted">Waiting for an opponent to accept.</p>
          ) : (
            <div className="mt-3">
              <StreakDisplay streak={stats.currentStreak} />
            </div>
          )}
        </div>
      </div>

      {!isTbd && (
        <dl className="mt-6 grid grid-cols-2 gap-4">
          {[
            {
              label: "Record",
              value: `${stats.record.wins}W – ${stats.record.losses}L`,
            },
            { label: "Win Rate", value: `${stats.winRate}%`, accent: true },
            {
              label: "Total Earnings",
              value: formatMoney(stats.totalEarnings, { compact: true }),
              span: true,
            },
          ].map((item) => (
            <div
              key={item.label}
              className={cn(
                "rounded-xl border border-border/60 bg-surface/80 px-4 py-3",
                item.span && "col-span-2",
              )}
            >
              <dt className="text-[10px] font-bold uppercase tracking-wider text-muted">
                {item.label}
              </dt>
              <dd
                className={cn(
                  "mt-1 text-lg font-bold tabular-nums",
                  item.accent && "text-success",
                )}
              >
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
