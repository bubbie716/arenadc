import { LegalDocumentBody } from "@/components/legal/LegalDocumentBody";
import { LegalDocumentFooter } from "@/components/legal/LegalDocumentFooter";
import { PageShell } from "@/components/PageShell";
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

export function LegalDocument({
  title,
  description,
  effectiveDate,
  lastUpdated,
  preamble,
  sections,
  footerNote,
}: LegalDocumentProps) {
  return (
    <PageShell title={title} description={description} maxWidth="lg">
      <LegalDocumentBody
        effectiveDate={effectiveDate}
        lastUpdated={lastUpdated}
        preamble={preamble}
        sections={sections}
      />

      <LegalDocumentFooter note={footerNote} />
    </PageShell>
  );
}
