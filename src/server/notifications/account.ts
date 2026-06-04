import { NotificationType } from "@prisma/client";
import { getActiveServerConfig } from "@/lib/server-context";
import { formatCurrency } from "@/lib/utils";
import { sendNotification } from "@/server/notifications/dispatch";

type NotifyOptions = { silent?: boolean };

export async function notifyAdminBalanceAdjustment(
  userId: string,
  amount: number,
  options?: NotifyOptions,
) {
  const config = await getActiveServerConfig();
  const sign = amount >= 0 ? "+" : "−";
  return sendNotification({
    userId,
    type: NotificationType.ADMIN_BALANCE_ADJUSTMENT,
    title: "Balance adjusted",
    message: `An admin adjusted your balance by ${sign}${formatCurrency(Math.abs(amount), config)}.`,
    silent: options?.silent,
  });
}

export async function notifyWalletFrozen(userId: string, options?: NotifyOptions) {
  return sendNotification({
    userId,
    type: NotificationType.WALLET_FROZEN,
    title: "Wallet frozen",
    message: "Your wallet has been frozen. Deposits, withdrawals, and wagers are disabled.",
    silent: options?.silent,
  });
}

export async function notifyWalletUnfrozen(userId: string, options?: NotifyOptions) {
  return sendNotification({
    userId,
    type: NotificationType.WALLET_UNFROZEN,
    title: "Wallet unfrozen",
    message: "Your wallet has been unfrozen. You can use wallet features again.",
    silent: options?.silent,
  });
}

export async function notifyAccountSuspended(userId: string, options?: NotifyOptions) {
  return sendNotification({
    userId,
    type: NotificationType.ACCOUNT_SUSPENDED,
    title: "Account suspended",
    message: "Your account has been suspended. Contact support on Discord for details.",
    silent: options?.silent,
  });
}

export async function notifyAccountUnsuspended(userId: string, options?: NotifyOptions) {
  return sendNotification({
    userId,
    type: NotificationType.ACCOUNT_UNSUSPENDED,
    title: "Account unsuspended",
    message: "Your account suspension has been lifted.",
    silent: options?.silent,
  });
}
