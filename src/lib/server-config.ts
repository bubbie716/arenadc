export type ServerId = "crp" | "drp";

/** Government without /police consent (CRP, DRP). */
export type RulesetKind = "government" | "government_no_police" | "openworld";

export type ServerConfig = {
  id: ServerId;
  code: ServerId;
  name: string;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
  subdomain: string;
  /** Hub card / branding (e.g. ArenaCRP). */
  arenaBrandName: string;
  /** In-game account that receives deposits. */
  depositAccountName: string;
  legalServerName: string;
  rulesetKind: RulesetKind;
  /** Public fight code prefix (e.g. ArenaCRP-0001). */
  fightIdPrefix: string;
  /** Require live-map coordinate verification to link Minecraft (DistrictRP only). */
  minecraftCoordinateVerification: boolean;
};

export const SERVER_CONFIG: Record<ServerId, ServerConfig> = {
  crp: {
    id: "crp",
    code: "crp",
    name: "CityRP",
    currencyCode: "CRP",
    currencyName: "CityRP Dollars",
    currencySymbol: "$",
    subdomain: "crp",
    arenaBrandName: "ArenaCRP",
    depositAccountName: "ArenaCRP",
    legalServerName: "CityRP",
    rulesetKind: "government_no_police",
    fightIdPrefix: "ArenaCRP",
    minecraftCoordinateVerification: false,
  },
  drp: {
    id: "drp",
    code: "drp",
    name: "DistrictRP",
    currencyCode: "NPF",
    currencyName: "Newport Florins",
    currencySymbol: "ƒ",
    subdomain: "drp",
    arenaBrandName: "ArenaDRP",
    depositAccountName: "ArenaDRP",
    legalServerName: "DistrictRP",
    rulesetKind: "government_no_police",
    fightIdPrefix: "ArenaDRP",
    minecraftCoordinateVerification: true,
  },
};

export const SERVER_IDS = Object.keys(SERVER_CONFIG) as ServerId[];

export const DEFAULT_SERVER_ID: ServerId = "crp";

export function isServerId(value: string): value is ServerId {
  return value in SERVER_CONFIG;
}

function isPlainLocalHost(host: string): boolean {
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/** Resolve server id from hostname (e.g. crp.arenamc.xyz → crp). */
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
 * (Safari often cannot resolve crp.localhost — use localhost:3000?server=crp instead).
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

export function requiresPoliceConsent(config: ServerConfig): boolean {
  return config.rulesetKind === "government";
}
