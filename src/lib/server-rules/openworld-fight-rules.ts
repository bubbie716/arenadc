import { FIGHT_RULES_SECTIONS } from "@/lib/legal/fight-rules-sections";
import type { LegalSection } from "@/lib/legal/types";
import type { ServerConfig } from "@/lib/server-config";

function cloneSections(sections: LegalSection[]): LegalSection[] {
  return JSON.parse(JSON.stringify(sections)) as LegalSection[];
}

const THIRD_PARTY_INTERFERENCE: LegalSection = {
  title: "9. Third-Party Interference",
  paragraphs: [
    "Scheduled ArenaMC fights are competitive matches between the agreed participants. Outside players must not interfere.",
    "Examples of interference include:",
  ],
  listItems: [
    "healing participants;",
    "assisting in combat;",
    "attacking fighters;",
    "supplying items;",
    "interfering with the agreed arena or location.",
  ],
  subsections: [
    {
      title: "",
      paragraphs: [
        "If third-party interference affects a scheduled fight, ArenaMC administrators may, in their sole discretion:",
      ],
      listItems: [
        "invalidate the fight;",
        "refund wagers;",
        "reschedule the fight;",
        "determine a winner if interference was insignificant.",
      ],
    },
    {
      title: "",
      paragraphs: [
        "Administrative decisions regarding interference are final.",
        "Participants should report interference promptly with any available POV evidence.",
      ],
    },
  ],
};

export function buildOpenworldFightRulesSections(
  config: ServerConfig,
): LegalSection[] {
  const sections = cloneSections(FIGHT_RULES_SECTIONS);
  const chatExample = `${config.fightIdPrefix}-0001`;

  const general = sections.find((s) => s.title.startsWith("1."));
  if (general?.listItems) {
    general.listItems = [
      "voluntary;",
      "competitive;",
      "governed by agreed fight settings;",
      `subject to ${config.legalServerName} server rules;`,
      "subject to ArenaMC moderation and enforcement.",
    ];
    general.paragraphs = ["All ArenaMC fights are scheduled competitive PvP matches that are:"];
  }

  const preFight = sections.find((s) => s.title.startsWith("4."));
  if (preFight) {
    preFight.subsections = [
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

  const arenaLeave = sections.find((s) => s.title.startsWith("6."));
  if (arenaLeave?.subsections?.[0]?.paragraphs) {
    arenaLeave.subsections[0].paragraphs = arenaLeave.subsections[0].paragraphs.map((p) =>
      p.replace("unlawfully abandoned the arena", "abandoned the agreed combat area"),
    );
  }

  const evidence = sections.find((s) => s.title.startsWith("12."));
  const evidenceSub = evidence?.subsections?.[0];
  if (evidenceSub?.listItems) {
    evidenceSub.listItems = evidenceSub.listItems.filter(
      (item) => !item.includes("/police consent"),
    );
  }

  const conductIdx = sections.findIndex((s) => s.title.startsWith("9. Fight Conduct"));
  if (conductIdx >= 0) {
    sections.splice(conductIdx, 0, THIRD_PARTY_INTERFERENCE);
    for (let i = conductIdx + 1; i < sections.length; i++) {
      const m = sections[i].title.match(/^(\d+)\./);
      if (m) {
        const n = Number(m[1]) + 1;
        sections[i] = { ...sections[i], title: sections[i].title.replace(/^\d+\./, `${n}.`) };
      }
    }
  }

  const interpretation = sections.find((s) => s.title.startsWith("15."));
  if (interpretation?.subsections?.[0]?.paragraphs) {
    const last = interpretation.subsections[0].paragraphs.at(-1);
    if (last?.includes("abide by these decisions")) {
      interpretation.subsections[0].paragraphs = [
        ...interpretation.subsections[0].paragraphs.slice(0, -1),
        "By participating in an ArenaMC fight, users voluntarily agree to the scheduled competitive PvP match and its agreed ruleset, and agree to abide by administrative decisions.",
      ];
    }
  }

  return sections;
}
