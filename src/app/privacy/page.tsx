import { LegalDocument } from "@/components/legal/LegalDocument";
import { PRIVACY_POLICY_SECTIONS } from "@/lib/legal/privacy-policy-sections";

export const metadata = {
  title: "Privacy Policy — ArenaMC",
};

const EFFECTIVE_DATE = "June 1, 2026";
const LAST_UPDATED = "June 1, 2026";

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      description="How ArenaMC collects, uses, stores, and protects information when you use the Platform."
      effectiveDate={EFFECTIVE_DATE}
      lastUpdated={LAST_UPDATED}
      preamble={[
        'ArenaMC ("ArenaMC," "we," "our," or "us") values user privacy and transparency.',
        "This Privacy Policy explains how ArenaMC collects, uses, stores, shares, and protects information when users access the ArenaMC website, platform, Discord integrations, fight systems, escrow systems, or related services (collectively, the \"Platform\").",
        "By using ArenaMC, you agree to this Privacy Policy.",
      ]}
      sections={PRIVACY_POLICY_SECTIONS}
    />
  );
}
