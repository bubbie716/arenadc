import { NotificationType } from "@prisma/client";
import { formatFightPublicId } from "@/lib/fight-display";
import { getActiveServerConfig } from "@/lib/server-context";
import { getScopedServerId } from "@/server/scope";
import { mapNotification } from "@/lib/mappers";
import { prisma } from "@/lib/prisma";
import type { AppNotification } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import {
  sendNotification,
  sendNotifications,
  type NotificationInput,
} from "@/server/notifications/dispatch";

export type CreateNotificationInput = NotificationInput;

export async function createNotification(input: CreateNotificationInput) {
  const sent = await sendNotification(input);
  if (!sent) return null;
  return prisma.notification.findFirst({
    where: { userId: input.userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createNotifications(inputs: CreateNotificationInput[]) {
  await sendNotifications(inputs);
}

async function fightLabel(fightNumber: number) {
  const serverId = await getScopedServerId();
  return formatFightPublicId(serverId, fightNumber);
}

export async function notifyFightInvite(params: {
  opponentUserId: string;
  fightId: string;
  fightNumber: number;
  creatorName: string;
  wagerAmount: number;
}) {
  const config = await getActiveServerConfig();
  const label = await fightLabel(params.fightNumber);
  const wager =
    params.wagerAmount > 0
      ? `${formatCurrency(params.wagerAmount, config)} wager`
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
  const label = await fightLabel(params.fightNumber);
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
  const label = await fightLabel(params.fightNumber);
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
  const label = await fightLabel(params.fightNumber);
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
  const label = await fightLabel(params.fightNumber);
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
  silent?: boolean;
}) {
  const label = await fightLabel(params.fightNumber);
  await createNotifications(
    params.userIds.map((userId) => ({
      userId,
      type: NotificationType.FIGHT_RESOLVED,
      title: "Fight resolved",
      message: `${label}: ${params.summary}`,
      relatedFightId: params.fightId,
      silent: params.silent,
    })),
  );
}

export async function notifyPayoutCompleted(params: {
  winnerUserId: string;
  fightId: string;
  fightNumber: number;
  amount: number;
}) {
  const config = await getActiveServerConfig();
  const label = await fightLabel(params.fightNumber);
  return createNotification({
    userId: params.winnerUserId,
    type: NotificationType.PAYOUT_COMPLETED,
    title: "Payout completed",
    message: `You received ${formatCurrency(params.amount, config)} from ${label}.`,
    relatedFightId: params.fightId,
  });
}

export async function getNotificationsForUser(
  userId: string,
  limit = 20,
): Promise<AppNotification[]> {
  const serverId = await getScopedServerId();
  const rows = await prisma.notification.findMany({
    where: { serverId, userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map(mapNotification);
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const serverId = await getScopedServerId();
  return prisma.notification.count({
    where: { serverId, userId, readAt: null },
  });
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const serverId = await getScopedServerId();
  await prisma.notification.updateMany({
    where: { serverId, id: notificationId, userId },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsRead(userId: string) {
  const serverId = await getScopedServerId();
  await prisma.notification.updateMany({
    where: { serverId, userId, readAt: null },
    data: { readAt: new Date() },
  });
}
