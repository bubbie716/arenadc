import { cookies, headers } from "next/headers";
import {
  DEFAULT_SERVER_ID,
  getServerConfig,
  isServerId,
  resolveServerIdForRequest,
  resolveServerIdFromHost,
  type ServerConfig,
  type ServerId,
} from "@/lib/server-config";

export const SERVER_ID_HEADER = "x-arenamc-server-id";
export const SERVER_ID_COOKIE = "arenamc-server-id";

/** Read active server from middleware header or Host (server components / actions). */
export async function getServerId(): Promise<ServerId> {
  const headerList = await headers();
  const fromHeader = headerList.get(SERVER_ID_HEADER);
  if (fromHeader && isServerIdHeader(fromHeader)) {
    return fromHeader;
  }

  const host = headerList.get("host") ?? "";
  const cookieStore = await cookies();
  return resolveServerIdForRequest({
    host,
    serverCookie: cookieStore.get(SERVER_ID_COOKIE)?.value,
  });
}

function isServerIdHeader(value: string): value is ServerId {
  return isServerId(value);
}

export async function getActiveServerConfig(): Promise<ServerConfig> {
  const serverId = await getServerId();
  return getServerConfig(serverId);
}

/** Sync helper when server id is already known (e.g. from JWT). */
export function getServerConfigForId(serverId: ServerId): ServerConfig {
  return getServerConfig(serverId);
}

export { DEFAULT_SERVER_ID, resolveServerIdFromHost };
