export type PoolSideTotals = {
  playerAId: string;
  playerBId: string;
  poolA: number;
  poolB: number;
  totalPool: number;
  poolAPercent: number;
  poolBPercent: number;
  betCount: number;
  bothSidesHaveLiquidity: boolean;
};

export function aggregateSpectatorPools(
  bets: { selectedFighterId: string; amount: number }[],
  playerAId: string,
  playerBId: string,
): PoolSideTotals {
  let poolA = 0;
  let poolB = 0;

  for (const bet of bets) {
    if (bet.selectedFighterId === playerAId) poolA += bet.amount;
    else if (bet.selectedFighterId === playerBId) poolB += bet.amount;
  }

  const totalPool = poolA + poolB;
  const poolAPercent = totalPool > 0 ? Math.round((poolA / totalPool) * 100) : 0;
  const poolBPercent = totalPool > 0 ? 100 - poolAPercent : 0;

  return {
    playerAId,
    playerBId,
    poolA,
    poolB,
    totalPool,
    poolAPercent,
    poolBPercent,
    betCount: bets.length,
    bothSidesHaveLiquidity: poolA > 0 && poolB > 0,
  };
}

/** Pari-mutuel payout including original stake. */
export function estimateSpectatorPayout(
  betAmount: number,
  selectedFighterId: string,
  winningFighterId: string,
  poolA: number,
  poolB: number,
  playerAId: string,
  feePercent: number,
): number {
  if (betAmount <= 0) return 0;
  if (selectedFighterId !== winningFighterId) return 0;

  const winningPool = winningFighterId === playerAId ? poolA : poolB;
  const losingPool = winningFighterId === playerAId ? poolB : poolA;
  if (winningPool <= 0) return 0;

  const totalPool = winningPool + losingPool;
  const distributablePool = totalPool - Math.floor(totalPool * feePercent);
  return Math.floor((betAmount / winningPool) * distributablePool);
}

export function calculateSpectatorPayouts(params: {
  bets: { id: string; selectedFighterId: string; amount: number }[];
  winnerFighterId: string;
  playerAId: string;
  playerBId: string;
  feePercent: number;
}): { betId: string; payout: number }[] {
  const { bets, winnerFighterId, playerAId, playerBId, feePercent } = params;
  const pools = aggregateSpectatorPools(bets, playerAId, playerBId);
  const winningPool = winnerFighterId === playerAId ? pools.poolA : pools.poolB;

  if (winningPool <= 0 || !pools.bothSidesHaveLiquidity) {
    return bets.map((bet) => ({ betId: bet.id, payout: 0 }));
  }

  const totalPool = pools.totalPool;
  const fee = Math.floor(totalPool * feePercent);
  const distributablePool = totalPool - fee;

  return bets.map((bet) => {
    if (bet.selectedFighterId !== winnerFighterId) {
      return { betId: bet.id, payout: 0 };
    }
    return {
      betId: bet.id,
      payout: Math.floor((bet.amount / winningPool) * distributablePool),
    };
  });
}

export function calculateSpectatorPoolFee(totalPool: number, feePercent: number): number {
  return Math.floor(totalPool * feePercent);
}

export function previewSpectatorPayoutForSide(
  summary: {
    playerAId: string;
    playerBId: string;
    poolA: number;
    poolB: number;
    feePercent: number;
  },
  side: "a" | "b",
  amount: number,
): number {
  const fighterId = side === "a" ? summary.playerAId : summary.playerBId;
  const poolA = summary.poolA + (side === "a" ? amount : 0);
  const poolB = summary.poolB + (side === "b" ? amount : 0);
  return estimateSpectatorPayout(
    amount,
    fighterId,
    fighterId,
    poolA,
    poolB,
    summary.playerAId,
    summary.feePercent,
  );
}
