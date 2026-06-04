"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ServerConfig } from "@/lib/server-config";
import { formatCurrency } from "@/lib/utils";

const ServerConfigContext = createContext<ServerConfig | null>(null);

export function ServerConfigProvider({
  config,
  children,
}: {
  config: ServerConfig;
  children: ReactNode;
}) {
  return (
    <ServerConfigContext.Provider value={config}>{children}</ServerConfigContext.Provider>
  );
}

export function useServerConfig(): ServerConfig {
  const config = useContext(ServerConfigContext);
  if (!config) {
    throw new Error("useServerConfig must be used within ServerConfigProvider");
  }
  return config;
}

export function useFormatCurrency() {
  const config = useServerConfig();
  return (amount: number, options?: { compact?: boolean; symbolOnly?: boolean }) =>
    formatCurrency(amount, config, options);
}
