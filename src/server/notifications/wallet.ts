import { NotificationType } from "@prisma/client";
import { createNotification, createNotifications } from "@/server/notifications";
import { prisma } from "@/lib/prisma";
import { formatRmd } from "@/lib/utils";

export async function notifyDepositApproved(userId: string, amount: number) {
  return createNotification({
    userId,
    type: NotificationType.DEPOSIT_APPROVED,
    title: "Deposit approved",
    message: `Your deposit of ${formatRmd(amount)} has been credited to your wallet.`,
  });
}

export async function notifyDepositRejected(userId: string, amount: number, adminNote: string) {
  return createNotification({
    userId,
    type: NotificationType.DEPOSIT_REJECTED,
    title: "Deposit rejected",
    message: `Your deposit request for ${formatRmd(amount)} was rejected. ${adminNote}`,
  });
}

export async function notifyWithdrawalPaid(
  userId: string,
  amount: number,
  minecraftUsername: string,
) {
  return createNotification({
    userId,
    type: NotificationType.WITHDRAWAL_PAID,
    title: "Withdrawal completed",
    message: `${formatRmd(amount)} was sent in-game to ${minecraftUsername}.`,
  });
}

export async function notifyWithdrawalRejected(userId: string, amount: number, adminNote: string) {
  return createNotification({
    userId,
    type: NotificationType.WITHDRAWAL_REJECTED,
    title: "Withdrawal rejected",
    message: `Your withdrawal of ${formatRmd(amount)} was rejected. Locked funds have been returned. ${adminNote}`,
  });
}

export async function notifyAdminsWithdrawalRequested(params: {
  requestId: string;
  userId: string;
  amount: number;
  minecraftUsername: string;
}) {
  const admins = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { id: true },
  });

  if (admins.length === 0) return;

  await createNotifications(
    admins.map((admin) => ({
      userId: admin.id,
      type: NotificationType.WITHDRAWAL_REQUESTED,
      title: "New withdrawal request",
      message: `${params.minecraftUsername} requested ${formatRmd(params.amount)}.`,
    })),
  );
}
