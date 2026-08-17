import type { ServerId } from "@/lib/server-config";
import { isServerId } from "@/lib/server-config";

export const HUB_LAST_SERVER_KEY = "arenamc-last-server";

export function readLastHubServer(): ServerId | null {
  try {
    const raw = localStorage.getItem(HUB_LAST_SERVER_KEY);
    return raw && isServerId(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function writeLastHubServer(serverId: ServerId): void {
  try {
    localStorage.setItem(HUB_LAST_SERVER_KEY, serverId);
  } catch {
    // ignore private mode / quota
  }
}
