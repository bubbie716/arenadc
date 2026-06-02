import { NotificationType } from "@prisma/client";
import { sendNotification } from "@/server/notifications/dispatch";
import { formatRmd } from "@/lib/utils";

export async function notifyAdminBalanceAdjustment(
  userId: string,
  amount: number,
  options?: { silent?: boolean },
) {
  const sign = amount >= 0 ? "+" : "";
  return sendNotification({
    userId,
    type: NotificationType.ADMIN_BALANCE_ADJUSTMENT,
    title: "Balance adjusted",
    message: `An admin adjusted your balance by ${sign}${formatRmd(Math.abs(amount))}.`,
    silent: options?.silent,
  });
}

export async function notifyWalletFrozen(userId: string, options?: { silent?: boolean }) {
  return sendNotification({
    userId,
    type: NotificationType.WALLET_FROZEN,
    title: "Wallet frozen",
    message: "Your wallet has been frozen. You can still schedule free fights, but deposits, withdrawals, and wagers are disabled.",
    silent: options?.silent,
  });
}

export async function notifyWalletUnfrozen(userId: string, options?: { silent?: boolean }) {
  return sendNotification({
    userId,
    type: NotificationType.WALLET_UNFROZEN,
    title: "Wallet unfrozen",
    message: "Your wallet has been unfrozen. You can deposit, withdraw, and wager again.",
    silent: options?.silent,
  });
}

export async function notifyAccountSuspended(userId: string, options?: { silent?: boolean }) {
  return sendNotification({
    userId,
    type: NotificationType.ACCOUNT_SUSPENDED,
    title: "Account suspended",
    message: "Your account has been suspended. Contact support for more information.",
    silent: options?.silent,
  });
}

export async function notifyAccountUnsuspended(userId: string, options?: { silent?: boolean }) {
  return sendNotification({
    userId,
    type: NotificationType.ACCOUNT_UNSUSPENDED,
    title: "Account reinstated",
    message: "Your account suspension has been lifted.",
    silent: options?.silent,
  });
}
