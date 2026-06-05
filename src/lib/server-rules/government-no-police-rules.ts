import { FIGHT_RULES_SECTIONS } from "@/lib/legal/fight-rules-sections";
import { TERMS_GOVERNMENT_SECTIONS } from "@/lib/server-rules/terms-government";
import type { LegalSection } from "@/lib/legal/types";
import type { ServerConfig } from "@/lib/server-config";

function cloneSections<T>(sections: T[]): T[] {
  return JSON.parse(JSON.stringify(sections)) as T[];
}

function noPolicePreFightSubsections(chatExample: string): LegalSection["subsections"] {
  return [
    {
      title: "Step 1 — Recording Requirement",
      paragraphs: [
        "Both fighters must start POV recording before any other pre-fight step and keep recording through the outcome.",
        "POV becomes mandatory when a dispute occurs, results are disputed, or admin review is needed.",
        "Acceptable recordings must:",
      ],
      listItems: [
        "be from the participant’s POV;",
        "clearly show Fight ID verification in local chat;",
        "clearly show combat;",
        "clearly show the outcome;",
        "be unedited or materially unaltered.",
      ],
    },
    {
      title: "",
      paragraphs: ["ArenaMC may reject recordings deemed:"],
      listItems: [
        "incomplete;",
        "misleading;",
        "excessively edited;",
        "obstructed;",
        "intentionally manipulated.",
      ],
    },
    {
      title: "Step 2 — Fight ID Verification",
      paragraphs: [
        "Before combat begins, both fighters must type the assigned Fight ID in local in-game chat while recording.",
        "Example:",
      ],
      codeBlocks: [["Fight ID"], [chatExample]],
    },
    {
      title: "",
      paragraphs: ["This must:"],
      listItems: [
        "occur before the fight begins;",
        "be visible in POV recordings when evidence is required;",
        "clearly identify the correct match.",
      ],
    },
    {
      title: "",
      paragraphs: [
        "Fight ID verification exists to prevent replay fraud, confirm identity, verify the correct fight, and reduce impersonation.",
        "Failure to show the Fight ID in your recording may result in forfeiture or fight invalidation.",
      ],
    },
    {
      title: "Step 3 — Arena Presence",
      paragraphs: [
        "Both fighters must be present at the agreed arena or location before combat begins.",
        "Failure to appear at the agreed location within the scheduled window may result in no-show forfeiture.",
      ],
    },
  ];
}

function stripPoliceFromEvidence(sections: LegalSection[]) {
  const evidence = sections.find((s) => s.title.startsWith("12."));
  const evidenceSub = evidence?.subsections?.[0];
  if (evidenceSub?.listItems) {
    evidenceSub.listItems = evidenceSub.listItems.filter(
      (item) => !item.includes("/police consent"),
    );
  }
}

export function buildGovernmentNoPoliceFightRulesSections(
  config: ServerConfig,
): LegalSection[] {
  const sections = cloneSections(FIGHT_RULES_SECTIONS);
  const chatExample = `${config.fightIdPrefix}-0001`;

  const preFight = sections.find((s) => s.title.startsWith("4."));
  if (preFight) {
    preFight.subsections = noPolicePreFightSubsections(chatExample);
  }

  stripPoliceFromEvidence(sections);
  return sections;
}

export function buildGovernmentNoPoliceTermsSections(): LegalSection[] {
  const sections = cloneSections(TERMS_GOVERNMENT_SECTIONS);
  const procedures = sections.find((s) => s.title.startsWith("5."));
  if (procedures) {
    procedures.subsections = [
      {
        title: "A. Recording Requirement",
        paragraphs: [
          "You must record your POV. All users participating in wagered fights are required to record their POV for the entire fight — recording is not optional.",
          "Each POV recording must capture fight start, all required pre-fight procedures, combat, and outcome.",
          "If a dispute arises, fighters must promptly submit their POV recording link. Failure to record your POV or provide required evidence may result in forfeiture.",
        ],
      },
      {
        title: "B. Fight Identification Requirement",
        paragraphs: [
          "Before a fight begins, both participants must visibly type the assigned Fight ID into local in-game chat.",
          "The Fight ID must be visible in each participant's POV recording.",
          "This requirement exists to verify identity, verify the correct fight, prevent fraudulent submissions, prevent replay manipulation, and assist dispute review.",
          "Failure to properly display the Fight ID may result in forfeiture or administrative action.",
        ],
      },
      {
        title: "C. Arena Presence",
        paragraphs: [
          "Both fighters must be present at the agreed arena or location before combat begins.",
          "Failure to appear at the agreed location within the scheduled window may result in no-show forfeiture.",
        ],
      },
    ];
  }

  return sections;
}
