import type { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type NotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedFightId?: string;
  /** Skip sending even if the user normally receives notifications. */
  silent?: boolean;
};

async function getMutedUserIds(userIds: string[]): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();
  const rows = await prisma.user.findMany({
    where: { id: { in: userIds }, notificationsMuted: true },
    select: { id: true },
  });
  return new Set(rows.map((r) => r.id));
}

/** Send a notification respecting user mute and per-action silent flag. */
export async function sendNotification(input: NotificationInput): Promise<boolean> {
  if (input.silent) return false;

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { notificationsMuted: true },
  });
  if (!user || user.notificationsMuted) return false;

  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      relatedFightId: input.relatedFightId,
    },
  });
  return true;
}

export async function sendNotifications(inputs: NotificationInput[]): Promise<number> {
  const eligible = inputs.filter((i) => !i.silent);
  if (eligible.length === 0) return 0;

  const muted = await getMutedUserIds([...new Set(eligible.map((i) => i.userId))]);
  const toCreate = eligible.filter((i) => !muted.has(i.userId));
  if (toCreate.length === 0) return 0;

  await prisma.notification.createMany({
    data: toCreate.map(({ userId, type, title, message, relatedFightId }) => ({
      userId,
      type,
      title,
      message,
      relatedFightId,
    })),
  });
  return toCreate.length;
}

export async function isUserNotificationsMuted(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationsMuted: true },
  });
  return user?.notificationsMuted ?? false;
}
