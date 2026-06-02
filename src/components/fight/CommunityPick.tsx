import type { CommunityPick as CommunityPickType } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CommunityPickProps {
  pick: CommunityPickType;
  playerA: string;
  playerB: string;
}

export function CommunityPick({ pick, playerA, playerB }: CommunityPickProps) {
  return (
    <Card className="mb-8 border-border/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Community Pick</CardTitle>
        <p className="text-xs text-muted">Stats only — not betting</p>
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
            <p className={cn("text-2xl font-black text-accent")}>{pick.playerAPercent}%</p>
          </div>
          <div className="text-right">
            <p className="font-bold">{playerB}</p>
            <p className="text-2xl font-black text-blue">{pick.playerBPercent}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
