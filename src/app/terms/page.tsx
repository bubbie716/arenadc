import { LegalDocument } from "@/components/legal/LegalDocument";
import { applyServerLegalText, localizeLegalSections } from "@/lib/legal/server-text";
import {
  getTermsSections,
  TERMS_EFFECTIVE_DATE,
  TERMS_LAST_UPDATED,
} from "@/lib/server-rules/terms";
import { getActiveServerConfig } from "@/lib/server-context";

export const metadata = {
  title: "Terms of Service — ArenaMC",
};

export default async function TermsPage() {
  const config = await getActiveServerConfig();
  const preamble = [
    'Welcome to ArenaMC ("ArenaMC," "we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of the ArenaMC website, platform, services, Discord integrations, fight systems, escrow systems, dispute systems, and any related features (collectively, the "Platform").',
    "By creating an account, accessing the Platform, participating in fights, depositing or withdrawing in-game currency, scheduling fights, accepting challenges, or otherwise using ArenaMC, you agree to be bound by these Terms.",
    "If you do not agree to these Terms, you may not use the Platform.",
  ].map((p) => applyServerLegalText(p, config));

  return (
    <LegalDocument
      title="Terms of Service"
      description="Terms governing your use of ArenaMC, including fights, escrow, disputes, and platform conduct."
      effectiveDate={TERMS_EFFECTIVE_DATE}
      lastUpdated={TERMS_LAST_UPDATED}
      preamble={preamble}
      sections={localizeLegalSections(getTermsSections(config), config)}
    />
  );
}
