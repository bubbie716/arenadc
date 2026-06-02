import type { FighterStats } from "@/lib/types";
import { formatRmd } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StreakDisplay } from "@/components/StreakDisplay";

interface FighterComparisonProps {
  playerA: string;
  playerB: string;
  statsA: FighterStats;
  statsB: FighterStats;
}

function CompareRow({
  label,
  valueA,
  valueB,
  highlightHigher,
}: {
  label: string;
  valueA: string;
  valueB: string;
  highlightHigher?: "a" | "b" | null;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-border/50 py-4 last:border-0">
      <p
        className={`text-right font-bold tabular-nums ${
          highlightHigher === "a" ? "text-accent" : ""
        }`}
      >
        {valueA}
      </p>
      <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p
        className={`font-bold tabular-nums ${
          highlightHigher === "b" ? "text-blue" : ""
        }`}
      >
        {valueB}
      </p>
    </div>
  );
}

export function FighterComparison({
  playerA,
  playerB,
  statsA,
  statsB,
}: FighterComparisonProps) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Head to Head</CardTitle>
        <p className="text-sm text-muted">
          {playerA} <span className="text-accent">vs</span> {playerB}
        </p>
      </CardHeader>
      <CardContent>
        <CompareRow
          label="Win Rate"
          valueA={`${statsA.winRate}%`}
          valueB={`${statsB.winRate}%`}
          highlightHigher={statsA.winRate > statsB.winRate ? "a" : statsB.winRate > statsA.winRate ? "b" : null}
        />
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-border/50 py-4">
          <div className="flex justify-end">
            <StreakDisplay streak={statsA.currentStreak} />
          </div>
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted">
            Streak
          </p>
          <div className="flex justify-start">
            <StreakDisplay streak={statsB.currentStreak} />
          </div>
        </div>
        <CompareRow
          label="Earnings"
          valueA={formatRmd(statsA.totalEarnings, true)}
          valueB={formatRmd(statsB.totalEarnings, true)}
          highlightHigher={
            statsA.totalEarnings > statsB.totalEarnings
              ? "a"
              : statsB.totalEarnings > statsA.totalEarnings
                ? "b"
                : null
          }
        />
        <CompareRow
          label="Record"
          valueA={`${statsA.record.wins}–${statsA.record.losses}`}
          valueB={`${statsB.record.wins}–${statsB.record.losses}`}
        />
      </CardContent>
    </Card>
  );
}
