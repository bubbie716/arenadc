import { ESCROW_POLICY_SECTIONS } from "@/lib/legal/escrow-policy-sections";
import type { LegalSection } from "@/lib/legal/types";

function cloneSections(sections: LegalSection[]): LegalSection[] {
  return JSON.parse(JSON.stringify(sections)) as LegalSection[];
}

export function buildOpenworldEscrowPolicySections(): LegalSection[] {
  const sections = cloneSections(ESCROW_POLICY_SECTIONS);

  const evidence = sections.find((s) => s.title.startsWith("7."));
  const required = evidence?.subsections?.find((s) => s.title === "Required Elements");
  if (required?.listItems) {
    required.listItems = required.listItems.filter((item) => !item.includes("/police consent"));
  }

  const forfeiture = sections.find((s) => s.title.startsWith("9."));
  const failVerify = forfeiture?.subsections?.find((s) => s.title === "C. Fail Verification Requirements");
  if (failVerify) {
    failVerify.paragraphs = ["Failing to properly show the assigned Fight ID in local chat."];
    failVerify.codeBlocks = undefined;
  }

  return sections;
}
