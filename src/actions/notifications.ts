"use server";

import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth/session";
import {
  getNotificationsForUser,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/server/notifications";
import type { ActionResult } from "@/actions/fights";

export async function fetchNotifications(): Promise<
  ActionResult<{
    notifications: Awaited<ReturnType<typeof getNotificationsForUser>>;
    unreadCount: number;
  }>
> {
  try {
    const user = await requireSessionUser();
    const [notifications, unreadCount] = await Promise.all([
      getNotificationsForUser(user.id),
      getUnreadNotificationCount(user.id),
    ]);
    return { ok: true, data: { notifications, unreadCount } };
  } catch {
    return { ok: false, error: "Could not load notifications." };
  }
}

export async function markNotificationAsRead(
  notificationId: string,
): Promise<ActionResult> {
  try {
    const user = await requireSessionUser();
    await markNotificationRead(user.id, notificationId);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update notification." };
  }
}

export async function markAllNotificationsAsRead(): Promise<ActionResult> {
  try {
    const user = await requireSessionUser();
    await markAllNotificationsRead(user.id);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update notifications." };
  }
}
