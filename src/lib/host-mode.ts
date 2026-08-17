import {
  DEFAULT_SERVER_ID,
  getServerConfig,
  isServerId,
  SERVER_IDS,
  type ServerId,
} from "@/lib/server-config";

export const HUB_HOST_MODE_HEADER = "x-arenamc-host-mode";

const APEX_HOSTS = new Set(["arenamc.xyz", "www.arenamc.xyz"]);

/** Retired arena hosts still covered by *.arenamc.xyz — send them to the hub. */
const RETIRED_ARENA_SUBDOMAINS = new Set(["dc", "sc", "sw", "swc"]);

/** True for apex domain (hub), false for arena subdomains. */
export function isHubHost(host: string): boolean {
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  // Dev: localhost = default arena; 127.0.0.1 = hub (see getArenaOrigin).
  if (process.env.NODE_ENV === "development" && hostname === "127.0.0.1") {
    return true;
  }
  return APEX_HOSTS.has(hostname);
}

export function isRetiredArenaHost(host: string): boolean {
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  const sub = hostname.split(".")[0];
  return Boolean(sub && RETIRED_ARENA_SUBDOMAINS.has(sub));
}

export function getHubOrigin(): string {
  if (process.env.NODE_ENV === "development") {
    const port = process.env.PORT ?? "3000";
    return `http://127.0.0.1:${port}`;
  }
  return "https://arenamc.xyz";
}

export function isArenaSubdomainHost(host: string): boolean {
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return true;
  }
  const sub = hostname.split(".")[0];
  return Boolean(sub && isServerId(sub));
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
    if (serverId === DEFAULT_SERVER_ID) {
      return `http://localhost:${port}`;
    }
    return `http://${subdomain}.localhost:${port}`;
  }

  return `https://${subdomain}.arenamc.xyz`;
}

export type HubServerPulse = {
  signedUpUsers: number;
  largestPotTodayLabel: string;
};

export type HubServerCard = {
  id: ServerId;
  name: string;
  arenaLabel: string;
  currencyCode: string;
  href: string;
  pulse: HubServerPulse;
  features: readonly [string, string, string];
};

export function getHubServerCards(
  pulseByServer: Record<ServerId, HubServerPulse>,
): HubServerCard[] {
  return SERVER_IDS.map((id) => {
    const config = getServerConfig(id);
    return {
      id,
      name: config.name,
      arenaLabel: config.arenaBrandName,
      currencyCode: config.currencyCode,
      href: getArenaOrigin(id),
      pulse: pulseByServer[id],
      features: [
        `${config.currencyCode} Economy`,
        "PvP Challenges",
        "Fight Records",
      ] as const,
    };
  });
}
