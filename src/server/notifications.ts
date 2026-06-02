import { NotificationType } from "@prisma/client";
import { formatFightDisplayId } from "@/lib/fight-display";
import { mapNotification } from "@/lib/mappers";
import { prisma } from "@/lib/prisma";
import type { AppNotification } from "@/lib/types";

type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedFightId?: string;
};

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      relatedFightId: input.relatedFightId,
    },
  });
}

export async function createNotifications(inputs: CreateNotificationInput[]) {
  if (inputs.length === 0) return;
  await prisma.notification.createMany({ data: inputs });
}

export async function notifyFightInvite(params: {
  opponentUserId: string;
  fightId: string;
  fightNumber: number;
  creatorName: string;
  wagerAmount: number;
}) {
  const label = formatFightDisplayId(params.fightNumber);
  const wager =
    params.wagerAmount > 0
      ? `${params.wagerAmount.toLocaleString()} RMD wager`
      : "Free fight";

  return createNotification({
    userId: params.opponentUserId,
    type: NotificationType.FIGHT_INVITE,
    title: "Fight invite received",
    message: `${params.creatorName} challenged you to ${label} (${wager}).`,
    relatedFightId: params.fightId,
  });
}

export async function notifyFightAccepted(params: {
  creatorUserId: string;
  fightId: string;
  fightNumber: number;
  accepterName: string;
  isOpenChallenge: boolean;
}) {
  const label = formatFightDisplayId(params.fightNumber);
  return createNotification({
    userId: params.creatorUserId,
    type: params.isOpenChallenge
      ? NotificationType.OPEN_CHALLENGE_ACCEPTED
      : NotificationType.FIGHT_ACCEPTED,
    title: params.isOpenChallenge ? "Open challenge accepted" : "Fight accepted",
    message: `${params.accepterName} accepted your challenge ${label}.`,
    relatedFightId: params.fightId,
  });
}

export async function notifyFightDeclined(params: {
  creatorUserId: string;
  fightId: string;
  fightNumber: number;
  declinerName: string;
}) {
  const label = formatFightDisplayId(params.fightNumber);
  return createNotification({
    userId: params.creatorUserId,
    type: NotificationType.FIGHT_DECLINED,
    title: "Fight declined",
    message: `${params.declinerName} declined your challenge ${label}.`,
    relatedFightId: params.fightId,
  });
}

export async function notifyFightDisputed(params: {
  userIds: string[];
  fightId: string;
  fightNumber: number;
}) {
  const label = formatFightDisplayId(params.fightNumber);
  await createNotifications(
    params.userIds.map((userId) => ({
      userId,
      type: NotificationType.FIGHT_DISPUTED,
      title: "Fight disputed",
      message: `${label} is disputed. Submit POV proof links within 15 minutes.`,
      relatedFightId: params.fightId,
    })),
  );
}

export async function notifyEvidenceSubmitted(params: {
  notifyUserIds: string[];
  fightId: string;
  fightNumber: number;
  submitterName: string;
}) {
  const label = formatFightDisplayId(params.fightNumber);
  await createNotifications(
    params.notifyUserIds.map((userId) => ({
      userId,
      type: NotificationType.EVIDENCE_UPLOADED,
      title: "Evidence link submitted",
      message: `${params.submitterName} submitted a proof link for ${label}.`,
      relatedFightId: params.fightId,
    })),
  );
}

export async function notifyFightResolved(params: {
  userIds: string[];
  fightId: string;
  fightNumber: number;
  summary: string;
}) {
  const label = formatFightDisplayId(params.fightNumber);
  await createNotifications(
    params.userIds.map((userId) => ({
      userId,
      type: NotificationType.FIGHT_RESOLVED,
      title: "Fight resolved",
      message: `${label}: ${params.summary}`,
      relatedFightId: params.fightId,
    })),
  );
}

export async function notifyPayoutCompleted(params: {
  winnerUserId: string;
  fightId: string;
  fightNumber: number;
  amount: number;
}) {
  const label = formatFightDisplayId(params.fightNumber);
  return createNotification({
    userId: params.winnerUserId,
    type: NotificationType.PAYOUT_COMPLETED,
    title: "Payout completed",
    message: `You received ${params.amount.toLocaleString()} RMD from ${label}.`,
    relatedFightId: params.fightId,
  });
}

export async function getNotificationsForUser(
  userId: string,
  limit = 20,
): Promise<AppNotification[]> {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map(mapNotification);
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}

export async function markNotificationRead(userId: string, notificationId: string) {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
