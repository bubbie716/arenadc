"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { voteCommunityPick } from "@/actions/community-pick";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CommunityPick as CommunityPickType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CommunityPickProps {
  pick: CommunityPickType;
  playerA: string;
  playerB: string;
}

export function CommunityPick({ pick, playerA, playerB }: CommunityPickProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleVote(side: "a" | "b") {
    startTransition(async () => {
      setError(null);
      const res = await voteCommunityPick(pick.fightId, side);
      if (!res.ok) {
        setError(res.error ?? "Could not vote.");
        return;
      }
      router.refresh();
    });
  }

  const hasVotes = pick.totalVotes > 0;

  return (
    <Card className="mb-8 border-border/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Community Pick</CardTitle>
        <p className="text-xs text-muted">
          {hasVotes
            ? `${pick.totalVotes.toLocaleString()} vote${pick.totalVotes === 1 ? "" : "s"} — not betting`
            : "Cast your pick — not betting"}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex h-3 overflow-hidden rounded-full bg-surface-elevated">
          <div
            className="bg-accent transition-all duration-500"
            style={{ width: `${pick.playerAPercent}%` }}
          />
          <div
            className="bg-blue transition-all duration-500"
            style={{ width: `${pick.playerBPercent}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-bold">{playerA}</p>
            <p className={cn("text-2xl font-black tabular-nums text-accent")}>
              {hasVotes ? `${pick.playerAPercent}%` : "—"}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold">{playerB}</p>
            <p className={cn("text-2xl font-black tabular-nums text-blue")}>
              {hasVotes ? `${pick.playerBPercent}%` : "—"}
            </p>
          </div>
        </div>

        {pick.canVote ? (
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              variant={pick.userVote === "a" ? undefined : "secondary"}
              disabled={pending}
              onClick={() => handleVote("a")}
            >
              {pick.userVote === "a" ? `Picked ${playerA}` : `Pick ${playerA}`}
            </Button>
            <Button
              size="sm"
              variant={pick.userVote === "b" ? undefined : "secondary"}
              disabled={pending}
              onClick={() => handleVote("b")}
            >
              {pick.userVote === "b" ? `Picked ${playerB}` : `Pick ${playerB}`}
            </Button>
          </div>
        ) : pick.userVote ? (
          <p className="text-xs text-muted">
            You picked {pick.userVote === "a" ? playerA : playerB}.
          </p>
        ) : (
          <p className="text-xs text-muted">Sign in to cast your pick.</p>
        )}

        {error && <p className="text-xs text-danger">{error}</p>}
      </CardContent>
    </Card>
  );
}
