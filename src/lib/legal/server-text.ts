import type { ServerConfig } from "@/lib/server-config";
import type { LegalSection, LegalSubsection } from "@/lib/legal/types";

/** Replace legacy DC/RMD placeholders in legal copy for the active server. */
export function applyServerLegalText(text: string, config: ServerConfig): string {
  return text
    .replaceAll("DemocracyCraft", config.legalServerName)
    .replaceAll("Redmont Dollars", config.currencyName)
    .replaceAll("RMD", config.currencyCode);
}

function localizeSubsection(sub: LegalSubsection, config: ServerConfig): LegalSubsection {
  return {
    title: applyServerLegalText(sub.title, config),
    paragraphs: sub.paragraphs?.map((p) => applyServerLegalText(p, config)),
    listItems: sub.listItems?.map((p) => applyServerLegalText(p, config)),
    codeBlocks: sub.codeBlocks?.map((block) =>
      block.map((line) => applyServerLegalText(line, config)),
    ),
  };
}

export function localizeLegalSections(
  sections: LegalSection[],
  config: ServerConfig,
): LegalSection[] {
  return sections.map((section) => ({
    title: applyServerLegalText(section.title, config),
    paragraphs: section.paragraphs?.map((p) => applyServerLegalText(p, config)),
    listItems: section.listItems?.map((p) => applyServerLegalText(p, config)),
    codeBlocks: section.codeBlocks?.map((block) =>
      block.map((line) => applyServerLegalText(line, config)),
    ),
    subsections: section.subsections?.map((sub) => localizeSubsection(sub, config)),
  }));
}
