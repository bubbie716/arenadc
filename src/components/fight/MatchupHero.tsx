import { MinecraftHead } from "@/components/MinecraftHead";
import { FightHypeBadge } from "@/components/FightHypeBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getFightHypeTags } from "@/lib/fight-hype";
import type { Fight } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MatchupHeroProps {
  fight: Fight;
}

function fighterHeadFrameClass(isWinner: boolean) {
  return cn(
    "rounded-2xl bg-surface-elevated p-2 shadow-lg transition-transform duration-300 hover:scale-105",
    isWinner
      ? "border-2 border-success ring-2 ring-success/30 shadow-success/25"
      : "border border-border",
  );
}

export function MatchupHero({ fight }: MatchupHeroProps) {
  const hypeTags = getFightHypeTags(fight);
  const playerAIsWinner = Boolean(fight.winner && fight.winner === fight.playerA);
  const playerBIsWinner = Boolean(
    fight.winner && fight.playerB !== "TBD" && fight.winner === fight.playerB,
  );

  return (
    <section className="relative mb-10 overflow-hidden rounded-3xl border border-border bg-surface">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute left-1/2 top-0 h-48 w-96 -translate-x-1/2 rounded-full bg-accent/15 blur-3xl" />

      <div className="relative px-6 py-8 sm:px-10 sm:py-10">
        <div className="mb-5 flex flex-wrap items-center justify-center gap-2.5 px-2">
          <StatusBadge status={fight.status} />
          {hypeTags.map((tag) => (
            <FightHypeBadge key={tag} tag={tag} />
          ))}
        </div>

        <div className="mx-auto grid max-w-3xl grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-8">
          <div className="flex flex-col items-center gap-2.5 text-center">
            <div className={fighterHeadFrameClass(playerAIsWinner)}>
              <MinecraftHead username={fight.playerA} size={128} />
            </div>
            <h1 className="text-2xl font-black sm:text-3xl">{fight.playerA}</h1>
            {playerAIsWinner && (
              <span className="text-xs font-bold uppercase tracking-wide text-success">Winner</span>
            )}
          </div>

          <div className="flex w-20 flex-col items-center justify-center gap-1 sm:w-24">
            <span
              className={cn(
                "text-3xl font-black leading-none tracking-tighter text-gradient-accent sm:text-4xl",
              )}
            >
              VS
            </span>
            <p className="font-mono text-xs font-semibold tracking-wide text-muted">
              {fight.displayId}
            </p>
          </div>

          <div className="flex flex-col items-center gap-2.5 text-center">
            <div className={fighterHeadFrameClass(playerBIsWinner)}>
              <MinecraftHead username={fight.playerB} size={128} />
            </div>
            <h1 className="text-2xl font-black sm:text-3xl">{fight.playerB}</h1>
            {playerBIsWinner && (
              <span className="text-xs font-bold uppercase tracking-wide text-success">Winner</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
