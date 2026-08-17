"use client";

import type { ReactNode } from "react";
import type { ServerConfig } from "@/lib/server-config";

function Highlight({ children }: { children: ReactNode }) {
  return <span className="font-semibold text-foreground">{children}</span>;
}

export function DepositInstructions({
  config,
  depositAccountName,
}: {
  config: ServerConfig;
  depositAccountName: string;
}) {
  if (config.rulesetKind === "openworld") {
    return (
      <>
        Send the exact amount of {config.currencyCode} to <Highlight>{depositAccountName}</Highlight> in{" "}
        {config.legalServerName}, then upload a screenshot showing the completed payment. Deposits
        are reviewed manually and are not credited until approved.
      </>
    );
  }

  return (
    <>
      Send the exact amount of in-game {config.currencyCode} to{" "}
      <Highlight>{depositAccountName}</Highlight>, then upload a screenshot showing the completed
      payment. Deposits are reviewed manually and are not credited until approved.
    </>
  );
}
