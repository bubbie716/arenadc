export type AccountFlags = {
  walletFrozen: boolean;
  suspendedAt: Date | null;
};

export function isAccountSuspended(user: AccountFlags): boolean {
  return user.suspendedAt != null;
}

/** Deposits, withdrawals, and other wallet movements. */
export function assertWalletTransactionsAllowed(
  user: AccountFlags,
): { ok: true } | { ok: false; error: string } {
  if (isAccountSuspended(user)) {
    return { ok: false, error: "Your account is suspended." };
  }
  if (user.walletFrozen) {
    return { ok: false, error: "Your wallet is frozen. Contact support." };
  }
  return { ok: true };
}

/** Scheduling or accepting a fight (free fights allowed when wallet is frozen). */
export function assertCanParticipateInFight(
  user: AccountFlags,
  wagerAmount: number,
): { ok: true } | { ok: false; error: string } {
  if (isAccountSuspended(user)) {
    return { ok: false, error: "Your account is suspended." };
  }
  if (wagerAmount > 0 && user.walletFrozen) {
    return {
      ok: false,
      error: "Your wallet is frozen. You can schedule and accept free fights only.",
    };
  }
  return { ok: true };
}
