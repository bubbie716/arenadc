export type ServerId = "dc" | "sc" | "sw";

export type ServerConfig = {
  id: ServerId;
  code: ServerId;
  name: string;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
  subdomain: string;
  depositAccountName: string;
  legalServerName: string;
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
    depositAccountName: "ArenaDC",
    legalServerName: "DemocracyCraft",
  },
  sc: {
    id: "sc",
    code: "sc",
    name: "StateCraft",
    currencyCode: "ALP",
    currencyName: "Alexandrian Pounds",
    currencySymbol: "£",
    subdomain: "sc",
    depositAccountName: "ArenaSC",
    legalServerName: "StateCraft",
  },
  sw: {
    id: "sw",
    code: "sw",
    name: "Stoneworks",
    currencyCode: "SWC",
    currencyName: "Stoneworks Coins",
    currencySymbol: "$",
    subdomain: "sw",
    depositAccountName: "ArenaSW",
    legalServerName: "Stoneworks",
  },
};

export const SERVER_IDS = Object.keys(SERVER_CONFIG) as ServerId[];

export const DEFAULT_SERVER_ID: ServerId = "dc";

export function isServerId(value: string): value is ServerId {
  return value in SERVER_CONFIG;
}

/** Resolve server id from hostname (e.g. dc.arenamc.xyz → dc). */
export function resolveServerIdFromHost(host: string): ServerId {
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return DEFAULT_SERVER_ID;
  }

  const parts = hostname.split(".");
  const subdomain = parts[0];

  if (subdomain && isServerId(subdomain)) {
    return subdomain;
  }

  return DEFAULT_SERVER_ID;
}

export function getServerConfig(serverId: ServerId = DEFAULT_SERVER_ID): ServerConfig {
  return SERVER_CONFIG[serverId];
}
