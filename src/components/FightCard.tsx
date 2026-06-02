import type { Fight } from "@/lib/types";
import { getFightHypeTags } from "@/lib/fight-hype";
import type { Rivalry } from "@/lib/types";
import { getFightLocationLabel } from "@/lib/fight-location";
import {
  calculatePot,
  formatRmd,
  getFormatLabel,
  getRulesetLabel,
  isHighStakesFight,
} from "@/lib/utils";
import { cn } from "@/lib/utils";
import { FightCountdown } from "./FightCountdown";
import { FightHypeBadge } from "./FightHypeBadge";
import { MinecraftHead } from "./MinecraftHead";
import { StatusBadge } from "./ui/StatusBadge";
import { Button } from "./ui/Button";

interface FightCardProps {
  fight: Fight;
  compact?: boolean;
  rankedFighters?: string[];
  rivalries?: Rivalry[];
}

export function FightCard({ fight, compact, rankedFighters, rivalries }: FightCardProps) {
  const { totalPot } = calculatePot(fight.wagerAmount);
  const hypeTags = getFightHypeTags(fight, { rankedFighters, rivalries });
  const highStakes = isHighStakesFight(fight.wagerAmount);

  return (
    <article
      className={cn(
        "card-interactive group relative overflow-hidden rounded-2xl border bg-surface",
        highStakes
          ? "border-warning/25 glow-high-stakes hover:border-warning/40"
          : "border-border hover:border-accent/40 hover:shadow-xl hover:shadow-accent/10",
        compact ? "p-4" : "p-5",
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-blue/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            <StatusBadge status={fight.status} />
            {hypeTags.slice(0, compact ? 1 : 2).map((tag) => (
              <FightHypeBadge key={tag} tag={tag} />
            ))}
          </div>
          <FightCountdown
            scheduledAt={fight.scheduledAt}
            status={fight.status}
            completedAt={fight.completedAt}
            size={compact ? "sm" : "md"}
          />
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
          <div className="flex flex-col items-center gap-1.5 text-center min-w-0">
            <MinecraftHead
              username={fight.playerA}
              size={compact ? 52 : 60}
              className="ring-2 ring-transparent transition-all group-hover:ring-accent/30"
            />
            <span className="max-w-full truncate text-sm font-bold">{fight.playerA}</span>
          </div>

          <div className="flex w-16 shrink-0 flex-col items-center justify-center gap-0.5 sm:w-20">
            <span className="text-lg font-black leading-none text-gradient-accent sm:text-xl">
              VS
            </span>
            <span className="text-sm font-bold tabular-nums text-foreground">
              {formatRmd(fight.wagerAmount, true)}
            </span>
            <span className="text-[10px] leading-none text-muted">each</span>
          </div>

          <div className="flex flex-col items-center gap-1.5 text-center min-w-0">
            <MinecraftHead
              username={fight.playerB}
              size={compact ? 52 : 60}
              className="ring-2 ring-transparent transition-all group-hover:ring-accent/30"
            />
            <span className="max-w-full truncate text-sm font-bold">{fight.playerB}</span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
          <span className="rounded-md border border-border/60 bg-surface-elevated px-2 py-0.5 text-muted">
            {getRulesetLabel(fight.ruleset)}
          </span>
          <span className="rounded-md border border-border/60 bg-surface-elevated px-2 py-0.5 text-muted">
            {getFormatLabel(fight.format)}
          </span>
          {!compact && (
            <span className="rounded-md border border-border/60 bg-surface-elevated px-2 py-0.5 text-muted">
              {getFightLocationLabel(fight.fightLocation, fight.arenaName)}
            </span>
          )}
        </div>

        <div
          className={cn(
            "mt-3.5 flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition-colors",
            highStakes
              ? "border-accent/30 bg-accent/5"
              : "border-border/80 bg-surface-elevated/50 group-hover:border-accent/20",
          )}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted leading-none">
              Total Pot
            </p>
            <p
              className={cn(
                "mt-1 font-black tabular-nums tracking-tight text-foreground leading-none",
                compact ? "text-2xl" : "text-3xl sm:text-[2rem]",
                highStakes && "text-gradient-accent",
              )}
            >
              {formatRmd(totalPot)}
            </p>
          </div>
          <Button href={`/fights/${fight.id}`} size="sm" variant="secondary">
            View Fight
          </Button>
        </div>

        {fight.status === "completed" && fight.winner && (
          <p className="mt-2.5 text-center text-xs text-success">
            Winner: <span className="font-bold">{fight.winner}</span>
          </p>
        )}
      </div>
    </article>
  );
}
