import type { LegalSection } from "@/lib/legal/types";
import type { ServerConfig } from "@/lib/server-config";
import { buildGovernmentNoPoliceTermsSections } from "@/lib/server-rules/government-no-police-rules";
import { TERMS_GOVERNMENT_SECTIONS } from "@/lib/server-rules/terms-government";
import { TERMS_OPENWORLD_SECTIONS } from "@/lib/server-rules/terms-openworld";

export const TERMS_EFFECTIVE_DATE = "June 1, 2026";
export const TERMS_LAST_UPDATED = "June 1, 2026";

export function getTermsSections(config: ServerConfig): LegalSection[] {
  if (config.rulesetKind === "openworld") return TERMS_OPENWORLD_SECTIONS;
  if (config.rulesetKind === "government_no_police") {
    return buildGovernmentNoPoliceTermsSections();
  }
  return TERMS_GOVERNMENT_SECTIONS;
}
