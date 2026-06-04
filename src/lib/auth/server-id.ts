import { cookies, headers } from "next/headers";
import {
  isServerId,
  resolveServerIdFromHost,
  type ServerId,
} from "@/lib/server-config";
import { SERVER_ID_COOKIE, SERVER_ID_HEADER } from "@/lib/server-context";

/** Resolve server for auth callbacks and server actions. */
export async function getAuthServerId(): Promise<ServerId> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(SERVER_ID_COOKIE)?.value;
  if (fromCookie && isServerId(fromCookie)) {
    return fromCookie;
  }

  const headerList = await headers();
  const fromHeader = headerList.get(SERVER_ID_HEADER);
  if (fromHeader && isServerId(fromHeader)) {
    return fromHeader;
  }

  const host = headerList.get("host") ?? "";
  return resolveServerIdFromHost(host);
}
