import { NotificationType } from "@prisma/client";
import { getActiveServerConfig } from "@/lib/server-context";
import { formatCurrency } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { sendNotification, sendNotifications } from "@/server/notifications/dispatch";
import { getScopedServerId } from "@/server/scope";

async function formatAmount(amount: number) {
  const config = await getActiveServerConfig();
  return formatCurrency(amount, config);
}

export async function notifyDepositSubmitted(userId: string, amount: number) {
  return sendNotification({
    userId,
    type: NotificationType.DEPOSIT_SUBMITTED,
    title: "Deposit submitted",
    message: `Your deposit request for ${await formatAmount(amount)} is pending admin review.`,
  });
}

export async function notifyWithdrawalSubmitted(userId: string, amount: number) {
  return sendNotification({
    userId,
    type: NotificationType.WITHDRAWAL_SUBMITTED,
    title: "Withdrawal submitted",
    message: `Your withdrawal of ${await formatAmount(amount)} is pending. Funds are locked until processed.`,
  });
}

export async function notifyDepositApproved(userId: string, amount: number) {
  return sendNotification({
    userId,
    type: NotificationType.DEPOSIT_APPROVED,
    title: "Deposit approved",
    message: `Your deposit of ${await formatAmount(amount)} has been credited to your wallet.`,
  });
}

export async function notifyDepositRejected(userId: string, amount: number, adminNote: string) {
  return sendNotification({
    userId,
    type: NotificationType.DEPOSIT_REJECTED,
    title: "Deposit rejected",
    message: `Your deposit request for ${await formatAmount(amount)} was rejected. ${adminNote}`,
  });
}

export async function notifyWithdrawalPaid(
  userId: string,
  amount: number,
  minecraftUsername: string,
) {
  return sendNotification({
    userId,
    type: NotificationType.WITHDRAWAL_PAID,
    title: "Withdrawal completed",
    message: `${await formatAmount(amount)} was sent in-game to ${minecraftUsername}.`,
  });
}

export async function notifyWithdrawalRejected(userId: string, amount: number, adminNote: string) {
  return sendNotification({
    userId,
    type: NotificationType.WITHDRAWAL_REJECTED,
    title: "Withdrawal rejected",
    message: `Your withdrawal of ${await formatAmount(amount)} was rejected. Locked funds have been returned. ${adminNote}`,
  });
}

async function notifyAdmins(
  type: NotificationType,
  title: string,
  message: string,
  excludeUserId?: string,
) {
  const serverId = await getScopedServerId();
  const admins = await prisma.user.findMany({
    where: {
      serverId,
      isAdmin: true,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true },
  });
  if (admins.length === 0) return;
  await sendNotifications(
    admins.map((admin) => ({
      userId: admin.id,
      type,
      title,
      message,
    })),
  );
}

export async function notifyAdminsDepositRequested(params: {
  userId: string;
  amount: number;
  minecraftUsername: string;
}) {
  await notifyAdmins(
    NotificationType.DEPOSIT_REQUESTED,
    "New deposit request",
    `${params.minecraftUsername} submitted a deposit request for ${await formatAmount(params.amount)}.`,
    params.userId,
  );
}

export async function notifyAdminsWithdrawalRequested(params: {
  userId: string;
  amount: number;
  minecraftUsername: string;
}) {
  await notifyAdmins(
    NotificationType.WITHDRAWAL_REQUESTED,
    "New withdrawal request",
    `${params.minecraftUsername} requested ${await formatAmount(params.amount)}.`,
    params.userId,
  );
}
