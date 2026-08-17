import type { ServerConfig } from "@/lib/server-config";

export function getWithdrawInstructions(config: ServerConfig): {
  primary: string;
  helper?: string;
} {
  if (config.rulesetKind === "openworld") {
    return {
      primary:
        "Withdrawals are manually processed in Stoneworks by ArenaMC staff. Your requested amount will be locked while the withdrawal is pending.",
      helper: "SWC will be sent in-game from an ArenaMC-affiliated account.",
    };
  }
  return {
    primary:
      "Withdrawals are manually processed in-game. Your requested amount will be locked while the withdrawal is pending.",
  };
}
