import type { LegalSection } from "@/lib/legal/types";

export const FIGHT_RULES_SECTIONS: LegalSection[] = [
  {
    title: "1. General Principles",
    paragraphs: ["All ArenaMC fights are:"],
    listItems: [
      "voluntary;",
      "consensual;",
      "governed by agreed fight settings;",
      "subject to DemocracyCraft server rules;",
      "subject to ArenaMC moderation and enforcement.",
    ],
    subsections: [
      {
        title: "",
        paragraphs: [
          "Participants are expected to compete in good faith.",
          "Unsportsmanlike conduct, fraud, exploitation, or intentional abuse may result in forfeiture, refunds, suspensions, or permanent removal from the Platform.",
        ],
      },
    ],
  },
  {
    title: "2. Fight Eligibility",
    paragraphs: ["Only registered ArenaMC users may:"],
    listItems: [
      "create fights;",
      "accept fights;",
      "participate in wagered fights;",
      "dispute outcomes;",
      "receive payouts.",
    ],
    subsections: [
      {
        title: "",
        paragraphs: ["All participants must:"],
        listItems: [
          "have linked their Minecraft username;",
          "maintain an active ArenaMC account;",
          "possess sufficient RMD for wagers.",
        ],
      },
      {
        title: "",
        paragraphs: ["ArenaMC reserves the right to deny participation for any reason."],
      },
    ],
  },
  {
    title: "3. Fight Types",
    paragraphs: ["Fights may include:"],
    listItems: [
      "No Armor Fists",
      "No Armor Sword",
      "Diamond Armor",
      "Iron Armor",
      "Bow Only",
      "Wooden Sword",
      "No Healing",
      "Custom Rule Sets approved by participants",
    ],
    subsections: [
      {
        title: "",
        paragraphs: [
          "Fight conditions must be agreed to before acceptance.",
          "Once a fight is accepted, rules may not be changed unless both fighters agree.",
        ],
      },
    ],
  },
  {
    title: "4. Required Pre-Fight Procedure",
    paragraphs: [
      "Before any wagered fight begins, participants must complete all required steps.",
      "Failure to complete required steps may result in:",
    ],
    listItems: [
      "automatic forfeiture;",
      "cancelled payout;",
      "invalidation of the fight;",
      "or administrative action.",
    ],
    subsections: [
      {
        title: "Step 1 — /police consent",
        paragraphs: ["Before combat begins, both fighters must type:"],
        codeBlocks: [["/police consent"]],
      },
      {
        title: "",
        paragraphs: [
          "This command must:",
          "Failure to visibly complete this step may result in automatic forfeiture or denial of payout.",
        ],
        listItems: [
          "be typed before combat begins;",
          "appear clearly in the POV recording;",
          "be visible and readable.",
        ],
      },
      {
        title: "Step 2 — Fight ID Verification",
        paragraphs: [
          "Before combat begins, both fighters must type the assigned Fight ID in local in-game chat.",
          "Example:",
        ],
        codeBlocks: [["Fight ID"], ["ArenaDC-0001"]],
      },
      {
        title: "",
        paragraphs: ["This must:"],
        listItems: [
          "occur before the fight begins;",
          "be visible in POV recordings;",
          "clearly identify the correct match.",
        ],
      },
      {
        title: "",
        paragraphs: [
          "Fight ID verification exists to:",
          "Failure to show the Fight ID may result in forfeiture or fight invalidation.",
        ],
        listItems: [
          "prevent replay fraud;",
          "confirm identity;",
          "verify the correct fight;",
          "reduce impersonation and manipulation.",
        ],
      },
      {
        title: "Step 3 — Recording Requirement",
        paragraphs: [
          "You must record your POV. All participants in wagered fights are required to record their POV for the entire fight — recording is not optional.",
          "Acceptable recordings must:",
        ],
        listItems: [
          "be from the participant’s POV;",
          "clearly show pre-fight verification;",
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
    ],
  },
  {
    title: "5. Arena Rules",
    paragraphs: [
      "All wagered fights must occur in the agreed arena.",
      "The arena is considered part of the agreed fight conditions.",
      "Participants may not intentionally exploit arena geography or leave the arena to avoid combat.",
    ],
  },
  {
    title: "6. Leaving the Arena (Automatic Forfeiture)",
    paragraphs: [
      "Participants who intentionally abandon the agreed combat area may automatically forfeit.",
      "Examples include:",
    ],
    listItems: [
      "intentionally running away to avoid likely defeat;",
      "escaping the designated fight area;",
      "repeatedly disengaging combat by fleeing outside arena boundaries;",
      "intentionally abusing terrain or movement to avoid fighting.",
    ],
    subsections: [
      {
        title: "",
        paragraphs: [
          "ArenaMC administrators may determine, in their sole discretion, whether a participant unlawfully abandoned the arena.",
          "Minor or ordinary combat movement will not alone constitute forfeiture.",
          "Intent matters.",
        ],
      },
    ],
  },
  {
    title: "7. Combat Logging & Disconnecting",
    paragraphs: ["A participant who intentionally:"],
    listItems: [
      "disconnects,",
      "logs out,",
      "leaves the server,",
      "crashes intentionally,",
      "or otherwise abandons combat",
    ],
    subsections: [
      {
        title: "",
        paragraphs: [
          "during an active fight may automatically forfeit.",
          "Unintentional disconnects may be reviewed at administrator discretion.",
          "Repeated disconnect claims may be treated as abuse.",
        ],
      },
    ],
  },
  {
    title: "8. No-Shows",
    paragraphs: [
      "Participants are expected to attend scheduled fights.",
      "A fighter who fails to appear within 15 minutes of the scheduled start time may forfeit.",
      "Administrators may:",
    ],
    listItems: [
      "extend time,",
      "void the fight,",
      "declare forfeiture,",
      "or refund wagers.",
    ],
  },
  {
    title: "9. Fight Conduct",
    paragraphs: ["Participants may not:"],
    listItems: [
      "cheat;",
      "use unauthorized advantages;",
      "intentionally exploit glitches;",
      "coordinate fake fights;",
      "throw fights for manipulation;",
      "collude to exploit wagers;",
      "intentionally falsify outcomes.",
    ],
    subsections: [
      {
        title: "",
        paragraphs: ["Examples of prohibited conduct:"],
        listItems: [
          "staged losses;",
          "alternate-account abuse;",
          "fake disputes;",
          "manipulated recordings;",
          "coordinated wager farming.",
        ],
      },
      {
        title: "",
        paragraphs: ["ArenaMC may suspend or permanently ban accounts involved in misconduct."],
      },
    ],
  },
  {
    title: "10. Wagers",
    paragraphs: ["Fighter wagers must:"],
    listItems: [
      "be equal;",
      "be agreed to before acceptance;",
      "be escrowed before the fight begins.",
    ],
    subsections: [
      {
        title: "",
        paragraphs: ["Upon acceptance:"],
        listItems: [
          "both wager amounts become locked;",
          "neither participant may withdraw escrowed funds.",
        ],
      },
      {
        title: "",
        paragraphs: ["Completed fights:"],
        listItems: [
          "winner receives the wager pot;",
          "ArenaMC deducts a 10% platform fee.",
        ],
      },
      {
        title: "",
        paragraphs: ["Example:"],
        codeBlocks: [["25,000 vs 25,000"]],
      },
      {
        title: "",
        paragraphs: ["Total pot:"],
        codeBlocks: [["50,000 RMD"]],
      },
      {
        title: "",
        paragraphs: ["Winner receives:"],
        codeBlocks: [["45,000 RMD"]],
      },
      {
        title: "",
        paragraphs: ["Platform fee:"],
        codeBlocks: [["5,000 RMD"]],
      },
    ],
  },
  {
    title: "11. Disputes",
    paragraphs: ["If fighters disagree on the result, either participant may mark the fight:"],
    subsections: [
      {
        title: "",
        codeBlocks: [["DISPUTED"]],
      },
      {
        title: "",
        paragraphs: ["Once disputed:"],
        listItems: [
          "payouts are paused;",
          "escrow remains locked;",
          "evidence review begins.",
        ],
      },
      {
        title: "",
        paragraphs: [
          "Both fighters must submit their POV recording links.",
          "Failure to record your POV, submit required recordings, or cooperate may result in forfeiture.",
        ],
      },
    ],
  },
  {
    title: "12. Evidence Submission Rules",
    paragraphs: [
      "Evidence must be submitted within 15 minutes of a dispute unless administrators grant an extension.",
      "Accepted evidence may include:",
    ],
    listItems: [
      "YouTube links",
      "Medal clips",
      "Streamable",
      "Imgur",
      "Google Drive",
      "Discord-hosted recordings",
    ],
    subsections: [
      {
        title: "",
        paragraphs: [
          "Evidence must reasonably demonstrate:",
          "Failure to provide sufficient evidence may result in forfeiture.",
        ],
        listItems: [
          "pre-fight verification;",
          "/police consent;",
          "Fight ID verification;",
          "combat;",
          "outcome.",
        ],
      },
    ],
  },
  {
    title: "13. Forfeitures",
    paragraphs: ["A participant may automatically forfeit for:"],
    listItems: [
      "abandoning the arena;",
      "combat logging;",
      "failing to record your POV as required;",
      "refusing to provide evidence or POV recordings;",
      "failing pre-fight verification;",
      "failure to appear;",
      "cheating;",
      "fight manipulation;",
      "repeated bad-faith conduct.",
    ],
    subsections: [
      {
        title: "",
        paragraphs: ["Forfeitures may result in:"],
        listItems: [
          "loss of wager;",
          "cancelled payout;",
          "suspension;",
          "permanent restrictions.",
        ],
      },
    ],
  },
  {
    title: "14. Administrative Authority",
    paragraphs: ["ArenaMC administrators maintain sole authority to:"],
    listItems: [
      "determine winners;",
      "resolve disputes;",
      "reject evidence;",
      "declare forfeitures;",
      "issue refunds;",
      "void fights;",
      "freeze payouts;",
      "suspend users;",
      "ban users.",
    ],
    subsections: [
      {
        title: "",
        paragraphs: [
          "Administrative decisions are final.",
          "ArenaMC is not obligated to reopen resolved disputes.",
        ],
      },
    ],
  },
  {
    title: "15. Rule Interpretation",
    paragraphs: [
      "No ruleset can predict every situation.",
      "Where circumstances are unclear, ArenaMC administrators may interpret these rules in a reasonable manner designed to preserve:",
    ],
    listItems: [
      "fairness,",
      "competitive integrity,",
      "anti-fraud protections,",
      "and community trust.",
    ],
    subsections: [
      {
        title: "",
        paragraphs: [
          "By participating in ArenaMC fights, users agree to abide by these decisions.",
        ],
      },
    ],
  },
  {
    title: "16. Changes to These Fight Rules",
    paragraphs: [
      "ArenaMC may update these Fight Rules periodically.",
      "Continued use of the Platform after updates constitutes acceptance of the revised Fight Rules.",
      "Users are responsible for reviewing the updated Fight Rules.",
    ],
  },
];
