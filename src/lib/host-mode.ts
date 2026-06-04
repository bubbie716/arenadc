import { getServerConfig, SERVER_IDS, type ServerId } from "@/lib/server-config";

export const HUB_HOST_MODE_HEADER = "x-arenamc-host-mode";

const APEX_HOSTS = new Set(["arenamc.xyz", "www.arenamc.xyz"]);

/** True for apex domain (hub), false for dc/sc/sw arena subdomains. */
export function isHubHost(host: string): boolean {
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  return APEX_HOSTS.has(hostname);
}

export function isArenaSubdomainHost(host: string): boolean {
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return true;
  }
  const sub = hostname.split(".")[0];
  return sub === "dc" || sub === "sc" || sub === "sw";
}

/** Arena app routes that must not run on the hub apex domain. */
export const ARENA_ONLY_PREFIXES = [
  "/schedule",
  "/wallet",
  "/referrals",
  "/profile",
  "/admin",
  "/onboarding",
  "/fights",
  "/terms",
  "/privacy",
  "/fight-rules",
] as const;

export function getArenaOrigin(serverId: ServerId): string {
  const subdomain = getServerConfig(serverId).subdomain;

  if (process.env.NODE_ENV === "development") {
    const port = process.env.PORT ?? "3000";
    if (serverId === "dc") {
      return `http://127.0.0.1:${port}`;
    }
    return `http://${subdomain}.localhost:${port}`;
  }

  return `https://${subdomain}.arenamc.xyz`;
}

export type HubServerCard = {
  id: ServerId;
  name: string;
  arenaLabel: string;
  currencyCode: string;
  href: string;
  activeUsers: number;
  features: readonly [string, string, string];
};

export function getHubServerCards(activeUsersByServer: Record<ServerId, number>): HubServerCard[] {
  return SERVER_IDS.map((id) => {
    const config = getServerConfig(id);
    return {
      id,
      name: config.name,
      arenaLabel: config.arenaBrandName,
      currencyCode: config.currencyCode,
      href: getArenaOrigin(id),
      activeUsers: activeUsersByServer[id] ?? 0,
      features: [
        `${config.currencyCode} Economy`,
        "PvP Challenges",
        "Fight Records",
      ] as const,
    };
  });
}
