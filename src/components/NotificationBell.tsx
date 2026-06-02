"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/actions/notifications";
import { formatDate } from "@/lib/utils";
import type { AppNotification } from "@/lib/types";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pending, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    startTransition(async () => {
      const res = await fetchNotifications();
      if (res.ok && res.data) {
        setNotifications(
          res.data.notifications.map((n) => ({
            id: n.id,
            type: n.type as AppNotification["type"],
            title: n.title,
            message: n.message,
            relatedFightId: n.relatedFightId,
            readAt: n.readAt,
            createdAt: n.createdAt,
          })),
        );
        setUnreadCount(res.data.unreadCount);
      }
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function handleOpen() {
    setOpen((v) => !v);
    if (!open) load();
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={handleOpen}
        className="relative cursor-pointer rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-accent/40 hover:text-foreground"
        aria-label="Notifications"
      >
        <span aria-hidden>🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-xl shadow-black/40">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-bold">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await markAllNotificationsAsRead();
                    load();
                  })
                }
                className="cursor-pointer text-xs text-accent hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-muted">No notifications yet.</li>
            ) : (
              notifications.map((n) => (
                <li
                  key={n.id}
                  className={`border-b border-border/50 px-4 py-3 text-sm last:border-0 ${
                    !n.readAt ? "bg-accent/5" : ""
                  }`}
                >
                  <p className="font-semibold">{n.title}</p>
                  <p className="mt-1 text-muted">{n.message}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span>{formatDate(n.createdAt)}</span>
                    {n.relatedFightId && (
                      <Link
                        href={`/fights/${n.relatedFightId}`}
                        className="font-medium text-accent hover:underline"
                        onClick={() => {
                          if (!n.readAt) {
                            markNotificationAsRead(n.id);
                          }
                          setOpen(false);
                        }}
                      >
                        View fight
                      </Link>
                    )}
                    {!n.readAt && (
                      <button
                        type="button"
                        className="cursor-pointer text-accent hover:underline"
                        onClick={() =>
                          startTransition(async () => {
                            await markNotificationAsRead(n.id);
                            load();
                          })
                        }
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
