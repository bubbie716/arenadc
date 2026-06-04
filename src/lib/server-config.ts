export type ServerId = "dc" | "sc" | "sw";

/** Government-style consent rules (DC, SC). Open-world competitive rules (SW). */
export type RulesetKind = "government" | "openworld";

export type ServerConfig = {
  id: ServerId;
  code: ServerId;
  name: string;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
  subdomain: string;
  /** Hub card / branding (e.g. ArenaSW). */
  arenaBrandName: string;
  /** In-game account that receives deposits (may differ from brand on SW). */
  depositAccountName: string;
  legalServerName: string;
  rulesetKind: RulesetKind;
  /** Public fight code prefix (e.g. ArenaDC-0001). */
  fightIdPrefix: string;
};

export const SERVER_CONFIG: Record<ServerId, ServerConfig> = {
  dc: {
    id: "dc",
    code: "dc",
    name: "DemocracyCraft",
    currencyCode: "RMD",
    currencyName: "Redmont Dollars",
    currencySymbol: "$",
    subdomain: "dc",
    arenaBrandName: "ArenaDC",
    depositAccountName: "ArenaDC",
    legalServerName: "DemocracyCraft",
    rulesetKind: "government",
    fightIdPrefix: "ArenaDC",
  },
  sc: {
    id: "sc",
    code: "sc",
    name: "StateCraft",
    currencyCode: "ALP",
    currencyName: "Alexandrian Pounds",
    currencySymbol: "£",
    subdomain: "sc",
    arenaBrandName: "ArenaSC",
    depositAccountName: "ArenaSC",
    legalServerName: "StateCraft",
    rulesetKind: "government",
    fightIdPrefix: "ArenaSC",
  },
  sw: {
    id: "sw",
    code: "sw",
    name: "Stoneworks",
    currencyCode: "SWC",
    currencyName: "Stoneworks Coins",
    currencySymbol: "$",
    subdomain: "sw",
    arenaBrandName: "ArenaSW",
    depositAccountName: "123lucas11",
    legalServerName: "Stoneworks",
    rulesetKind: "openworld",
    fightIdPrefix: "ArenaSW",
  },
};

export const SERVER_IDS = Object.keys(SERVER_CONFIG) as ServerId[];

export const DEFAULT_SERVER_ID: ServerId = "dc";

export function isServerId(value: string): value is ServerId {
  return value in SERVER_CONFIG;
}

function isPlainLocalHost(host: string): boolean {
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/** Resolve server id from hostname (e.g. dc.arenamc.xyz → dc). */
export function resolveServerIdFromHost(host: string): ServerId {
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";

  if (isPlainLocalHost(host)) {
    return DEFAULT_SERVER_ID;
  }

  const parts = hostname.split(".");
  const subdomain = parts[0];

  if (subdomain && isServerId(subdomain)) {
    return subdomain;
  }

  return DEFAULT_SERVER_ID;
}

/**
 * Dev-only: on plain localhost/127.0.0.1, honor ?server= or arenamc-server-id cookie
 * (Safari often cannot resolve sw.localhost — use localhost:3000?server=sw instead).
 */
export function resolveServerIdForRequest(options: {
  host: string;
  serverCookie?: string | null;
  serverQuery?: string | null;
}): ServerId {
  const fromHost = resolveServerIdFromHost(options.host);

  if (!isPlainLocalHost(options.host)) {
    return fromHost;
  }

  if (process.env.NODE_ENV === "development") {
    if (options.serverQuery && isServerId(options.serverQuery)) {
      return options.serverQuery;
    }
    if (options.serverCookie && isServerId(options.serverCookie)) {
      return options.serverCookie;
    }
  }

  return DEFAULT_SERVER_ID;
}

export function getServerConfig(serverId: ServerId = DEFAULT_SERVER_ID): ServerConfig {
  return SERVER_CONFIG[serverId];
}
