import type { Prisma } from "@prisma/client";
import { WalletTransactionType } from "@prisma/client";
import { getActiveServerConfig } from "@/lib/server-context";
import { formatCurrency } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export type LedgerTxClient = Prisma.TransactionClient;

export class InsufficientBalanceError extends Error {
  constructor() {
    super("INSUFFICIENT_BALANCE");
  }
}

/** Apply a ledger entry and sync user.walletBalance. Amount is signed (+ credit, − debit). */
export async function postLedgerEntry(
  tx: LedgerTxClient,
  params: {
    userId: string;
    type: WalletTransactionType;
    amount: number;
    description: string;
    fightId?: string | null;
    createdById?: string | null;
    withdrawRequestId?: string | null;
    depositRequestId?: string | null;
  },
) {
  if (params.amount === 0) {
    throw new Error("LEDGER_AMOUNT_ZERO");
  }

  const user = await tx.user.findUniqueOrThrow({
    where: { id: params.userId },
    select: {
      serverId: true,
      walletBalance: true,
      walletFrozen: true,
      suspendedAt: true,
    },
  });

  const nextBalance = user.walletBalance + params.amount;
  if (nextBalance < 0) {
    throw new InsufficientBalanceError();
  }

  await tx.user.update({
    where: { id: params.userId },
    data: { walletBalance: nextBalance },
  });

  return tx.walletTransaction.create({
    data: {
      serverId: user.serverId,
      userId: params.userId,
      type: params.type,
      amount: params.amount,
      description: params.description,
      fightId: params.fightId ?? null,
      createdById: params.createdById ?? null,
      withdrawRequestId: params.withdrawRequestId ?? null,
      depositRequestId: params.depositRequestId ?? null,
    },
  });
}

export async function getWalletBalances(userId: string) {
  const [user, escrowAgg, pendingWithdrawAgg] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { walletBalance: true },
    }),
    prisma.escrow.aggregate({
      where: { userId, status: "LOCKED" },
      _sum: { amount: true },
    }),
    prisma.withdrawRequest.aggregate({
      where: { userId, status: "PENDING" },
      _sum: { amount: true },
    }),
  ]);

  const escrowBalance = escrowAgg._sum.amount ?? 0;
  const pendingWithdrawals = pendingWithdrawAgg._sum.amount ?? 0;
  const ledgerBalance = user.walletBalance;

  return {
    ledgerBalance,
    escrowBalance,
    pendingWithdrawals,
    /** Spendable for new withdrawals (ledger already net of pending withdrawal locks). */
    availableBalance: ledgerBalance,
  };
}

export async function assertAvailableForWithdraw(userId: string, amount: number) {
  const { availableBalance, escrowBalance } = await getWalletBalances(userId);
  if (amount > availableBalance) {
    const config = await getActiveServerConfig();
    return {
      ok: false as const,
      error: `Insufficient available balance. You have ${formatCurrency(availableBalance, config)} available (${formatCurrency(escrowBalance, config)} in fight escrow).`,
    };
  }
  return { ok: true as const };
}
