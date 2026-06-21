"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SpectatorBetModal } from "@/components/fight/SpectatorBetModal";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormatCurrency } from "@/components/providers/ServerConfigProvider";
import type { SpectatorPoolSummary } from "@/lib/types";
import { allowFighterSpectatorBets, allowMultipleSpectatorBetsPerUser } from "@/lib/spectator-betting/fighter-bets";
import { cn, getStartsInCountdownText } from "@/lib/utils";

interface SpectatorPredictionPoolProps {
  pool: SpectatorPoolSummary;
  playerA: string;
  playerB: string;
  isFighter: boolean;
  walletBalance: number;
}

function poolStatusLabel(pool: SpectatorPoolSummary): string {
  if (pool.status === "open" && pool.canBet) return "Predictions Open";
  if (pool.status === "locked") return "Prediction pool locked";
  if (pool.status === "refunded") return "Prediction pool refunded";
  if (pool.status === "settled") return "Prediction pool settled";
  return "Prediction pool closed";
}

export function SpectatorPredictionPool({
  pool,
  playerA,
  playerB,
  isFighter,
  walletBalance,
}: SpectatorPredictionPoolProps) {
  const router = useRouter();
  const formatMoney = useFormatCurrency();
  const [betSide, setBetSide] = useState<"a" | "b" | null>(null);
  const fighterBetsAllowed = allowFighterSpectatorBets();
  const fighterBlocked = isFighter && !fighterBetsAllowed;
  const multiSideDevBets = allowMultipleSpectatorBetsPerUser();
  const canBetOnA =
    pool.canBet && !pool.userHasPendingBetOnA && (!pool.userBet || multiSideDevBets);
  const canBetOnB =
    pool.canBet && !pool.userHasPendingBetOnB && (!pool.userBet || multiSideDevBets);

  const closesIn = getStartsInCountdownText(pool.closesAt);

  return (
    <>
      <Card className="mb-8 border-border/80">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Spectator Prediction Pool</CardTitle>
              <p className="mt-1 text-xs text-muted">
                Prediction pools use in-game currency only. Payouts are based on final pool sizes
                and are not fixed odds.
              </p>
            </div>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide",
                pool.canBet
                  ? "bg-success/15 text-success"
                  : "bg-surface-elevated text-muted",
              )}
            >
              {poolStatusLabel(pool)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex h-3 overflow-hidden rounded-full bg-surface-elevated">
            <div
              className="bg-accent transition-all duration-500"
              style={{ width: `${pool.poolAPercent}%` }}
            />
            <div
              className="bg-blue transition-all duration-500"
              style={{ width: `${pool.poolBPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-bold">{playerA}</p>
              <p className="text-xl font-black tabular-nums text-accent">
                {formatMoney(pool.poolA, { compact: true })}
              </p>
              <p className="text-xs text-muted">{pool.poolAPercent}% of pool</p>
            </div>
            <div className="text-right">
              <p className="font-bold">{playerB}</p>
              <p className="text-xl font-black tabular-nums text-blue">
                {formatMoney(pool.poolB, { compact: true })}
              </p>
              <p className="text-xs text-muted">{pool.poolBPercent}% of pool</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-surface-elevated/50 px-4 py-3 text-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                Total Pool
              </p>
              <p className="text-lg font-black tabular-nums">{formatMoney(pool.totalPool)}</p>
            </div>
            <div className="text-right text-xs text-muted">
              {pool.canBet ? (
                <>
                  <p>Closes {closesIn}</p>
                  <p>{pool.betCount} prediction{pool.betCount === 1 ? "" : "s"}</p>
                </>
              ) : pool.status === "refunded" ? (
                <p>Prediction pool refunded: no opposing liquidity.</p>
              ) : (
                <p>{pool.betCount} prediction{pool.betCount === 1 ? "" : "s"}</p>
              )}
            </div>
          </div>

          {!pool.bothSidesHaveLiquidity && pool.canBet && pool.totalPool > 0 && (
            <p className="rounded-xl bg-warning/10 px-4 py-3 text-sm text-warning">
              Pool activates once both sides have predictions.
            </p>
          )}

          {pool.userBet && (
            <p className="text-sm text-muted">
              Your prediction:{" "}
              <span className="font-semibold text-foreground">
                {formatMoney(pool.userBet.amount)} on{" "}
                {pool.userBet.side === "a" ? playerA : playerB}
                {pool.userBet.status === "won" &&
                  pool.userBet.payoutAmount != null &&
                  ` — won ${formatMoney(pool.userBet.payoutAmount)}`}
                {pool.userBet.status === "lost" && " — lost"}
                {pool.userBet.status === "refunded" && " — refunded"}
              </span>
            </p>
          )}

          {fighterBlocked ? (
            <p className="rounded-xl bg-surface-elevated px-4 py-3 text-sm text-muted">
              Fighters cannot predict on their own fight.
            </p>
          ) : canBetOnA || canBetOnB ? (
            <>
              {isFighter && fighterBetsAllowed && (
                <p className="mb-3 rounded-xl bg-warning/10 px-4 py-2 text-xs text-warning">
                  Dev mode: fighters can predict on their own fight for testing.
                </p>
              )}
              {multiSideDevBets && pool.canBet && (
                <p className="mb-3 rounded-xl bg-warning/10 px-4 py-2 text-xs text-warning">
                  Dev mode: you can predict on both fighters to fill both sides of the pool.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {canBetOnA && (
                  <Button size="sm" onClick={() => setBetSide("a")}>
                    Bet on {playerA}
                  </Button>
                )}
                {canBetOnB && (
                  <Button size="sm" variant="secondary" onClick={() => setBetSide("b")}>
                    Bet on {playerB}
                  </Button>
                )}
              </div>
            </>
          ) : pool.canBet && pool.userBet && !multiSideDevBets ? (
            <p className="text-sm text-muted">Predictions cannot be edited after placement.</p>
          ) : pool.status === "settled" ? (
            <p className="text-sm text-muted">Prediction pool settled.</p>
          ) : pool.status === "locked" ? (
            <p className="text-sm text-muted">Prediction pool locked.</p>
          ) : null}
        </CardContent>
      </Card>

      {betSide && (
        <SpectatorBetModal
          open
          side={betSide}
          pool={pool}
          walletBalance={walletBalance}
          onClose={() => setBetSide(null)}
          onSuccess={() => router.refresh()}
        />
      )}
    </>
  );
}
