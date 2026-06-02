"use client";

import { useEffect, useState } from "react";
import { MinecraftHead } from "@/components/MinecraftHead";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlatformStats, Rivalry, TrendingFighter } from "@/lib/types";
import { formatRmd } from "@/lib/utils";
import { cn } from "@/lib/utils";

const PANELS = ["fighter", "rivalry", "stats"] as const;
type Panel = (typeof PANELS)[number];

interface HomeSidePanelProps {
  trendingFighter: TrendingFighter | null;
  rivalry: Rivalry | null;
  platformStats: PlatformStats;
}

export function HomeSidePanel({
  trendingFighter,
  rivalry,
  platformStats,
}: HomeSidePanelProps) {
  const [active, setActive] = useState<Panel>(trendingFighter ? "fighter" : "stats");

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => {
        const available = PANELS.filter((p) => {
          if (p === "fighter") return Boolean(trendingFighter);
          if (p === "rivalry") return Boolean(rivalry);
          return true;
        });
        const i = available.indexOf(prev as Panel);
        return available[(i + 1) % available.length] ?? "stats";
      });
    }, 8000);
    return () => clearInterval(id);
  }, [trendingFighter, rivalry]);

  const visiblePanels = PANELS.filter((p) => {
    if (p === "fighter") return Boolean(trendingFighter);
    if (p === "rivalry") return Boolean(rivalry);
    return true;
  });

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {visiblePanels.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setActive(p)}
            className={cn(
              "h-1.5 flex-1 cursor-pointer rounded-full transition-all duration-300",
              active === p ? "bg-accent" : "bg-border hover:bg-muted/50",
            )}
          />
        ))}
      </div>

      <Card className="card-interactive overflow-hidden border-accent/20 glow-accent">
        <div key={active} className="animate-[fade-in_0.4s_ease-out]">
          {active === "fighter" && trendingFighter && (
            <>
              <CardHeader className="border-b border-border/50 bg-gradient-to-br from-accent/10 to-transparent">
                <p className="text-xs font-bold uppercase tracking-widest text-accent">
                  Trending Fighter
                </p>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <MinecraftHead username={trendingFighter.username} size={48} />
                  #{trendingFighter.rank} {trendingFighter.username}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-5">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted">On platform</p>
                    <p className="font-bold">Active</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Balance</p>
                    <p className="font-bold">{formatRmd(trendingFighter.biggestWin, true)}</p>
                  </div>
                </div>
                <Button href="/profile" variant="secondary" className="w-full">
                  View Profile
                </Button>
              </CardContent>
            </>
          )}

          {active === "rivalry" && rivalry && (
            <>
              <CardHeader className="border-b border-border/50 bg-gradient-to-br from-blue/10 to-transparent">
                <p className="text-xs font-bold uppercase tracking-widest text-blue">
                  Featured Matchup
                </p>
                <CardTitle className="text-xl leading-tight">
                  {rivalry.playerA}{" "}
                  <span className="font-normal text-muted">vs</span> {rivalry.playerB}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <div className="rounded-xl border border-border bg-surface-elevated p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Next fight
                  </p>
                  <p className="mt-1 text-lg font-bold">{rivalry.nextFightLabel}</p>
                </div>
                <Button href={`/fights/${rivalry.nextFightId}`} className="w-full">
                  View Fight
                </Button>
              </CardContent>
            </>
          )}

          {active === "stats" && (
            <>
              <CardHeader className="border-b border-border/50">
                <p className="text-xs font-bold uppercase tracking-widest text-accent">
                  Live Platform
                </p>
                <CardTitle>Activity Pulse</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                {[
                  { label: "Active Fighters", value: platformStats.activeFighters.toString() },
                  {
                    label: "RMD Wagered Today",
                    value: formatRmd(platformStats.rmdWageredToday, true),
                  },
                  { label: "Fights This Week", value: platformStats.fightsThisWeek.toString() },
                  {
                    label: "Largest Pot Today",
                    value: formatRmd(platformStats.largestPotToday, true),
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0"
                  >
                    <span className="text-sm text-muted">{stat.label}</span>
                    <span className="font-bold tabular-nums">{stat.value}</span>
                  </div>
                ))}
              </CardContent>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
