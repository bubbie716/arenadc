import { LegalDocumentBody } from "@/components/legal/LegalDocumentBody";
import { LegalDocumentFooter } from "@/components/legal/LegalDocumentFooter";
import { PageShell } from "@/components/PageShell";
import { resolveDiscordInviteUrl } from "@/components/MaintenanceGuard";
import type { LegalSection } from "@/lib/legal/types";

export type { LegalSection, LegalSubsection } from "@/lib/legal/types";

interface LegalDocumentProps {
  title: string;
  description: string;
  effectiveDate?: string;
  lastUpdated?: string;
  preamble?: string[];
  sections: LegalSection[];
  footerNote?: string;
}

export async function LegalDocument({
  title,
  description,
  effectiveDate,
  lastUpdated,
  preamble,
  sections,
  footerNote,
}: LegalDocumentProps) {
  const discordInviteUrl = await resolveDiscordInviteUrl();

  return (
    <PageShell title={title} description={description} maxWidth="lg" discordInviteUrl={discordInviteUrl}>
      <LegalDocumentBody
        effectiveDate={effectiveDate}
        lastUpdated={lastUpdated}
        preamble={preamble}
        sections={sections}
      />

      <LegalDocumentFooter discordInviteUrl={discordInviteUrl} note={footerNote} />
    </PageShell>
  );
}
