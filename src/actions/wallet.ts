"use server";

import { revalidatePath } from "next/cache";
import {
  DepositRequestStatus,
  WalletTransactionType,
  WithdrawRequestStatus,
} from "@prisma/client";
import { requireOnboardedUser } from "@/lib/auth/session";
import { assertWalletTransactionsAllowed } from "@/lib/account-restrictions";
import { getResolvedPlatformSettings } from "@/server/platform-settings";
import { assertAvailableForWithdraw, postLedgerEntry } from "@/lib/wallet/ledger";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/actions/fights";
import {
  notifyAdminsDepositRequested,
  notifyAdminsWithdrawalRequested,
  notifyDepositSubmitted,
  notifyWithdrawalSubmitted,
} from "@/server/notifications/wallet";
import { isValidProofImageUrl } from "@/lib/wallet/proof-storage";

const MIN_AMOUNT = 100;
const MAX_DEPOSIT = 1_000_000;
const MAX_PENDING_DEPOSITS = 5;
const MAX_PENDING_WITHDRAWS = 3;

export async function submitDepositRequest(input: {
  amount: number;
  proofImageUrl: string;
}): Promise<ActionResult<{ requestId: string }>> {
  try {
    const user = await requireOnboardedUser();
    const walletCheck = assertWalletTransactionsAllowed(user);
    if (!walletCheck.ok) {
      return { ok: false, error: walletCheck.error };
    }

    const amount = Math.floor(input.amount);
    if (amount < MIN_AMOUNT || amount > MAX_DEPOSIT) {
      return { ok: false, error: `Enter an amount between ${MIN_AMOUNT} and ${MAX_DEPOSIT.toLocaleString()} RMD.` };
    }

    const proofImageUrl = input.proofImageUrl?.trim();
    if (!proofImageUrl || !isValidProofImageUrl(proofImageUrl)) {
      return { ok: false, error: "Payment proof image is required." };
    }

    const pending = await prisma.depositRequest.count({
      where: { userId: user.id, status: DepositRequestStatus.PENDING },
    });
    if (pending >= MAX_PENDING_DEPOSITS) {
      return { ok: false, error: "You have too many pending deposit requests." };
    }

    const request = await prisma.depositRequest.create({
      data: {
        userId: user.id,
        amount,
        proofImageUrl,
        status: DepositRequestStatus.PENDING,
      },
    });

    await notifyDepositSubmitted(user.id, amount);
    await notifyAdminsDepositRequested({
      userId: user.id,
      amount,
      minecraftUsername: user.minecraftUsername ?? user.discordUsername,
    });

    revalidatePath("/wallet");
    revalidatePath("/admin");
    return { ok: true, data: { requestId: request.id } };
  } catch {
    return { ok: false, error: "Could not submit deposit request." };
  }
}

export async function submitWithdrawalRequest(input: {
  amount: number;
  minecraftUsername: string;
}): Promise<ActionResult<{ requestId: string }>> {
  try {
    const user = await requireOnboardedUser();
    const walletCheck = assertWalletTransactionsAllowed(user);
    if (!walletCheck.ok) {
      return { ok: false, error: walletCheck.error };
    }

    const platformSettings = await getResolvedPlatformSettings();
    if (!platformSettings.withdrawalsEnabled) {
      return { ok: false, error: "Withdrawals are temporarily disabled." };
    }

    const amount = Math.floor(input.amount);
    if (amount < MIN_AMOUNT) {
      return { ok: false, error: `Minimum withdrawal is ${MIN_AMOUNT} RMD.` };
    }

    const minecraftUsername = input.minecraftUsername.trim();
    if (!minecraftUsername || minecraftUsername.length > 16) {
      return { ok: false, error: "Enter a valid Minecraft username." };
    }

    const available = await assertAvailableForWithdraw(user.id, amount);
    if (!available.ok) {
      return { ok: false, error: available.error };
    }

    const pending = await prisma.withdrawRequest.count({
      where: { userId: user.id, status: WithdrawRequestStatus.PENDING },
    });
    if (pending >= MAX_PENDING_WITHDRAWS) {
      return { ok: false, error: "You already have pending withdrawal requests." };
    }

    const request = await prisma.$transaction(async (tx) => {
      const fresh = await tx.user.findUniqueOrThrow({ where: { id: user.id } });
      if (fresh.walletBalance < amount) {
        throw new Error("INSUFFICIENT");
      }

      const created = await tx.withdrawRequest.create({
        data: {
          userId: user.id,
          amount,
          minecraftUsername,
          status: WithdrawRequestStatus.PENDING,
        },
      });

      await postLedgerEntry(tx, {
        userId: user.id,
        type: WalletTransactionType.WITHDRAWAL_LOCK,
        amount: -amount,
        description: `Withdrawal lock — pending payout to ${minecraftUsername}`,
        withdrawRequestId: created.id,
      });

      return created;
    });

    await notifyWithdrawalSubmitted(user.id, amount);
    await notifyAdminsWithdrawalRequested({
      userId: user.id,
      amount,
      minecraftUsername,
    });

    revalidatePath("/wallet");
    revalidatePath("/admin");
    return { ok: true, data: { requestId: request.id } };
  } catch (e) {
    if (e instanceof Error && e.message === "INSUFFICIENT") {
      return { ok: false, error: "Insufficient available balance." };
    }
    return { ok: false, error: "Could not submit withdrawal request." };
  }
}
