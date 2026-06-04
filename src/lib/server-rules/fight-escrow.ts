import { ESCROW_POLICY_SECTIONS } from "@/lib/legal/escrow-policy-sections";
import { FIGHT_RULES_SECTIONS } from "@/lib/legal/fight-rules-sections";
import type { LegalSection } from "@/lib/legal/types";
import type { ServerConfig } from "@/lib/server-config";
import { buildOpenworldEscrowPolicySections } from "@/lib/server-rules/openworld-escrow-policy";
import { buildOpenworldFightRulesSections } from "@/lib/server-rules/openworld-fight-rules";

export const FIGHT_ESCROW_EFFECTIVE_DATE = "June 1, 2026";
export const FIGHT_ESCROW_LAST_UPDATED = "June 1, 2026";

export type FightEscrowTab = "fight-rules" | "escrow";

export const FIGHT_ESCROW_TABS: { id: FightEscrowTab; label: string }[] = [
  { id: "fight-rules", label: "Fight Rules" },
  { id: "escrow", label: "Escrow Policy" },
];

export function getFightRulesSections(config: ServerConfig): LegalSection[] {
  return config.rulesetKind === "openworld"
    ? buildOpenworldFightRulesSections(config)
    : FIGHT_RULES_SECTIONS;
}

export function getEscrowPolicySections(config: ServerConfig): LegalSection[] {
  return config.rulesetKind === "openworld"
    ? buildOpenworldEscrowPolicySections()
    : ESCROW_POLICY_SECTIONS;
}

export function getFightRulesTabContent(config: ServerConfig) {
  return {
    documentTitle: "Fight Rules & Competition Policy",
    preamble: [
      'This Fight Rules & Competition Policy ("Fight Rules") governs all fights, wagers, disputes, arenas, and competitive activity conducted through ArenaMC.',
      "By creating, accepting, participating in, spectating, or disputing a fight, users agree to follow these rules.",
      "These rules exist to maintain fairness, reduce disputes, and preserve competitive integrity.",
      "ArenaMC administrators reserve the right to interpret, enforce, modify, or apply these rules in their sole discretion.",
    ],
    sections: getFightRulesSections(config),
  } as const;
}

export function getEscrowPolicyTabContent(config: ServerConfig) {
  return {
    documentTitle: "Escrow, Dispute, & Evidence Policy",
    preamble: [
      'This Escrow, Dispute & Evidence Policy ("Policy") governs how ArenaMC manages fighter wagers, escrowed RMD, disputes, evidence review, forfeitures, refunds, and payout decisions.',
      "By creating, accepting, or participating in a wagered fight, users agree to this Policy.",
    ],
    sections: getEscrowPolicySections(config),
  } as const;
}

export function parseFightEscrowTab(tab: string | null | undefined): FightEscrowTab {
  return tab === "escrow" ? "escrow" : "fight-rules";
}
