import { getServerId } from "@/lib/server-context";
import type { ServerId } from "@/lib/server-config";

/** Active tenant server id for the current request. */
export async function getScopedServerId(): Promise<ServerId> {
  return getServerId();
}
