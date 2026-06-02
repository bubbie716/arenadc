import {
  DepositRequestStatus,
  EscrowStatus,
  FightStatus,
  WalletTransactionType,
  WithdrawRequestStatus,
} from "@prisma/client";
import { formatFightDisplayId } from "@/lib/fight-display";
import { TX_WAGER_LOSS } from "@/lib/wallet-tx-types";
import { getWalletBalances } from "@/lib/wallet/ledger";
import { mapFightStatus } from "@/lib/mappers";
import { prisma } from "@/lib/prisma";
import type { FightStatus as UiFightStatus, Transaction } from "@/lib/types";

async function backfillEscrowLockDescriptions(userId: string) {
  const locks = await prisma.walletTransaction.findMany({
    where: {
      userId,
      type: WalletTransactionType.ESCROW_LOCK,
      fightId: { not: null },
      NOT: { description: { contains: "Fight-" } },
    },
    include: { fight: { select: { fightNumber: true } } },
  });

  for (const tx of locks) {
    if (!tx.fight) continue;
    const vsMatch = tx.description.match(/vs (.+)$/i);
    const vsSuffix = vsMatch ? ` vs ${vsMatch[1]}` : "";
    const fightLabel = formatFightDisplayId(tx.fight.fightNumber);

    await prisma.walletTransaction.update({
      where: { id: tx.id },
      data: { description: `Escrow lock — ${fightLabel}${vsSuffix}` },
    });
  }
}

async function backfillWagerLossTransactions(userId: string) {
  const lostEscrows = await prisma.escrow.findMany({
    where: {
      userId,
      status: EscrowStatus.RELEASED,
      fight: {
        status: FightStatus.COMPLETED,
        wagerAmount: { gt: 0 },
        winnerId: { not: userId },
      },
    },
    include: {
      fight: {
        select: {
          id: true,
          fightNumber: true,
          wagerAmount: true,
          playerAId: true,
          playerBId: true,
          completedAt: true,
          playerA: { select: { minecraftUsername: true } },
          playerB: { select: { minecraftUsername: true } },
        },
      },
    },
  });

  for (const escrow of lostEscrows) {
    const existing = await prisma.walletTransaction.findFirst({
      where: { userId, fightId: escrow.fightId, type: TX_WAGER_LOSS },
    });
    if (existing) continue;

    const fight = escrow.fight;
    const fightLabel = formatFightDisplayId(fight.fightNumber);
    const opponentName =
      userId === fight.playerAId
        ? fight.playerB?.minecraftUsername
        : fight.playerA?.minecraftUsername;
    const vs = opponentName ? ` vs ${opponentName}` : "";

    await prisma.walletTransaction.create({
      data: {
        userId,
        type: TX_WAGER_LOSS,
        amount: -fight.wagerAmount,
        description: `Fight loss — ${fightLabel}${vs}`,
        fightId: fight.id,
        ...(fight.completedAt ? { createdAt: fight.completedAt } : {}),
      },
    });
  }
}

function mapWalletTxType(type: WalletTransactionType): Transaction["type"] {
  const map: Partial<Record<WalletTransactionType, Transaction["type"]>> = {
    DEPOSIT: "deposit",
    WITHDRAWAL_LOCK: "withdrawal_lock",
    WITHDRAWAL_PAID: "withdrawal_paid",
    WITHDRAWAL_RELEASE: "withdrawal_release",
    WITHDRAW: "withdrawal_paid",
    ESCROW_LOCK: "escrow",
    ESCROW_RELEASE: "escrow",
    PAYOUT: "payout",
    WAGER_LOSS: "loss",
    FEE: "platform_fee",
    PLATFORM_FEE: "platform_fee",
    REFUND: "refund",
    ADMIN_ADJUSTMENT: "admin_adjustment",
  };
  return map[type] ?? "deposit";
}

function mapDepositRequest(d: {
  id: string;
  amount: number;
  proofImageUrl: string;
  note: string | null;
  status: DepositRequestStatus;
  adminNote: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
}) {
  return {
    id: d.id,
    amount: d.amount,
    proofImageUrl: d.proofImageUrl,
    note: d.note,
    status: d.status.toLowerCase() as "pending" | "approved" | "rejected",
    adminNote: d.adminNote,
    createdAt: d.createdAt.toISOString(),
    reviewedAt: d.reviewedAt?.toISOString() ?? null,
  };
}

function mapWithdrawRequest(w: {
  id: string;
  amount: number;
  minecraftUsername: string;
  note: string | null;
  status: WithdrawRequestStatus;
  adminNote: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
}) {
  return {
    id: w.id,
    amount: w.amount,
    minecraftUsername: w.minecraftUsername,
    note: w.note,
    status: w.status.toLowerCase() as "pending" | "approved" | "paid" | "rejected",
    adminNote: w.adminNote,
    createdAt: w.createdAt.toISOString(),
    reviewedAt: w.reviewedAt?.toISOString() ?? null,
  };
}

export async function getWalletData(userId: string) {
  await backfillEscrowLockDescriptions(userId);
  await backfillWagerLossTransactions(userId);

  const balances = await getWalletBalances(userId);

  const [transactions, escrows, depositRequests, withdrawRequests] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.escrow.findMany({
      where: { userId, status: EscrowStatus.LOCKED },
      include: {
        fight: {
          include: {
            playerA: { select: { minecraftUsername: true } },
            playerB: { select: { minecraftUsername: true } },
            createdBy: { select: { minecraftUsername: true } },
          },
        },
      },
    }),
    prisma.depositRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.withdrawRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { minecraftUsername: true },
  });

  const escrowTotal = escrows.reduce((sum, e) => sum + e.amount, 0);

  const pendingEscrows = escrows.map((e) => {
    const self = user.minecraftUsername;
    const opponent =
      e.fight.playerA?.minecraftUsername === self
        ? e.fight.playerB?.minecraftUsername
        : e.fight.playerA?.minecraftUsername ??
          e.fight.createdBy.minecraftUsername;
    return {
      fightId: e.fightId,
      opponent: opponent ?? "Unknown",
      amount: e.amount,
      scheduledAt: e.fight.scheduledAt.toISOString(),
      status: mapFightStatus(e.fight.status) as UiFightStatus,
      completedAt: e.fight.completedAt?.toISOString(),
    };
  });

  const upcomingPayouts = escrows
    .filter((e) => {
      const active: FightStatus[] = [
        FightStatus.SCHEDULED,
        FightStatus.IN_PROGRESS,
        FightStatus.AWAITING_RESULT,
      ];
      return active.includes(e.fight.status);
    })
    .map((e) => {
      const pot = e.amount * 2;
      const payout = Math.floor(pot * 0.9);
      const opponent =
        e.fight.playerA?.minecraftUsername === user.minecraftUsername
          ? e.fight.playerB?.minecraftUsername
          : e.fight.playerA?.minecraftUsername;
      return {
        fightId: e.fightId,
        opponent: opponent ?? "TBD",
        estimatedAmount: payout,
        label: "If you win — mutual confirm",
      };
    });

  const allDeposits = depositRequests.map(mapDepositRequest);
  const allWithdrawals = withdrawRequests.map(mapWithdrawRequest);

  return {
    balance: balances.availableBalance,
    escrowBalance: escrowTotal,
    pendingWithdrawals: balances.pendingWithdrawals,
    lifetimeEarnings: transactions
      .filter((t) => t.type === WalletTransactionType.PAYOUT)
      .reduce((sum, t) => sum + t.amount, 0),
    transactions: transactions.map((t) => ({
      id: t.id,
      type: mapWalletTxType(t.type),
      amount: t.amount,
      description: t.description,
      createdAt: t.createdAt.toISOString(),
      fightId: t.fightId ?? undefined,
    })),
    pendingEscrows,
    upcomingPayouts,
    depositRequests: allDeposits,
    withdrawRequests: allWithdrawals,
    pendingDepositRequests: allDeposits.filter((d) => d.status === "pending"),
    pendingWithdrawRequests: allWithdrawals.filter((w) => w.status === "pending"),
    defaultMinecraftUsername: user.minecraftUsername ?? "",
    depositAccountName:
      process.env.NEXT_PUBLIC_DEPOSIT_ACCOUNT_NAME?.trim() || "ArenaMC",
  };
}

export type WalletPageData = Awaited<ReturnType<typeof getWalletData>>;
