import type { LegalSection } from "@/lib/legal/types";

export const ESCROW_POLICY_SECTIONS: LegalSection[] = [
  {
    title: "1. Purpose of Escrow",
    paragraphs: [
      "ArenaMC uses an escrow system to protect both participants in a wagered fight.",
      "Escrow exists to:",
    ],
    listItems: [
      "prevent non-payment;",
      "reduce scams;",
      "guarantee equal wager commitment;",
      "ensure fair payouts;",
      "preserve competitive integrity.",
    ],
    subsections: [
      {
        title: "",
        paragraphs: [
          "Escrowed RMD is temporarily locked for the duration of an active fight and may not be withdrawn, transferred, or otherwise used until resolution.",
        ],
      },
    ],
  },
  {
    title: "2. Equal Wager Requirement",
    paragraphs: ["All fighter wagers must be:"],
    listItems: [
      "equal;",
      "voluntarily accepted;",
      "confirmed before the fight begins.",
    ],
    subsections: [
      {
        title: "",
        paragraphs: ["Example:"],
        codeBlocks: [["Player A: 25,000 RMD", "Player B: 25,000 RMD"]],
      },
      {
        title: "",
        paragraphs: ["Upon acceptance:"],
        codeBlocks: [["Total Pot: 50,000 RMD"]],
      },
      {
        title: "",
        paragraphs: [
          "ArenaMC does not permit unequal fighter wagers unless explicitly supported in a future platform update.",
        ],
      },
    ],
  },
  {
    title: "3. Escrow Locking",
    paragraphs: ["Once a fight is accepted:"],
    listItems: [
      "both fighters’ wager amounts become locked in escrow;",
      "escrowed balances may not be withdrawn;",
      "funds cannot be cancelled unilaterally.",
    ],
    subsections: [
      {
        title: "",
        paragraphs: ["Escrow remains locked until:"],
        listItems: [
          "fight completion;",
          "dispute resolution;",
          "cancellation;",
          "refund determination;",
          "or administrative action.",
        ],
      },
      {
        title: "",
        paragraphs: [
          "Users acknowledge that active escrow temporarily restricts access to wagered RMD.",
        ],
      },
    ],
  },
  {
    title: "4. Fight Completion & Standard Payouts",
    paragraphs: ["A fight is considered completed when:"],
    subsections: [
      {
        title: "A. Mutual Confirmation",
        paragraphs: ["Both fighters agree on the result.", "Example:", "Player A:"],
        codeBlocks: [["I Won"]],
      },
      {
        title: "",
        paragraphs: ["Player B:"],
        codeBlocks: [["I Lost"]],
      },
      {
        title: "",
        paragraphs: ["OR"],
      },
      {
        title: "B. Administrative Resolution",
        paragraphs: [
          "ArenaMC determines a winner after reviewing evidence.",
          "Once finalized:",
        ],
        listItems: [
          "payout is processed;",
          "escrow unlocks;",
          "fight status becomes:",
        ],
        codeBlocks: [["COMPLETED"]],
      },
    ],
  },
  {
    title: "5. Platform Fee",
    paragraphs: ["ArenaMC deducts a 10% platform fee from completed wager pots.", "Example:"],
    codeBlocks: [["25,000 vs 25,000"]],
    subsections: [
      {
        title: "",
        paragraphs: ["Total pot:"],
        codeBlocks: [["50,000 RMD"]],
      },
      {
        title: "",
        paragraphs: ["Platform fee:"],
        codeBlocks: [["5,000 RMD"]],
      },
      {
        title: "",
        paragraphs: ["Winner payout:"],
        codeBlocks: [["45,000 RMD"]],
      },
      {
        title: "",
        paragraphs: [
          "Fees may be modified at ArenaMC’s discretion.",
          "Updated fees will be disclosed through the Platform.",
        ],
      },
    ],
  },
  {
    title: "6. Disputes",
    paragraphs: [
      "If participants disagree regarding the outcome of a fight, either participant may mark the fight:",
    ],
    subsections: [
      {
        title: "",
        codeBlocks: [["DISPUTED"]],
      },
      {
        title: "",
        paragraphs: ["Once disputed:"],
        listItems: [
          "payouts pause;",
          "escrow remains locked;",
          "evidence review begins;",
          "the fight status updates to:",
        ],
        codeBlocks: [["DISPUTED"]],
      },
      {
        title: "",
        paragraphs: ["or"],
        codeBlocks: [["AWAITING_RECORDINGS"]],
      },
      {
        title: "",
        paragraphs: ["No payouts occur during active disputes."],
      },
    ],
  },
  {
    title: "7. Evidence Submission Requirements",
    paragraphs: [
      "You must record your POV. All participants in wagered fights are required to record their POV for the entire fight.",
      "When a dispute occurs, participants must submit POV evidence from their required recording.",
      "Evidence must reasonably demonstrate:",
    ],
    subsections: [
      {
        title: "Required Elements",
        listItems: [
          "/police consent",
          "Assigned Fight ID typed in local chat",
          "Beginning of combat",
          "Relevant combat events",
          "Fight outcome",
        ],
      },
      {
        title: "",
        paragraphs: ["Evidence that omits required elements may be rejected."],
      },
      {
        title: "Accepted Evidence Formats",
        paragraphs: ["ArenaMC currently accepts evidence links from:"],
        listItems: [
          "YouTube",
          "Medal",
          "Streamable",
          "Imgur",
          "Google Drive",
          "Discord-hosted recordings",
        ],
      },
      {
        title: "",
        paragraphs: [
          "ArenaMC may expand or restrict accepted formats at any time.",
        ],
      },
      {
        title: "Submission Deadline",
        paragraphs: ["Evidence must generally be submitted within:"],
        codeBlocks: [["15 minutes"]],
      },
      {
        title: "",
        paragraphs: [
          "of dispute creation.",
          "Extensions may be granted at administrator discretion.",
          "Failure to provide evidence may result in:",
        ],
        listItems: [
          "forfeiture;",
          "loss of wager;",
          "administrative penalties.",
        ],
      },
    ],
  },
  {
    title: "8. Recording Standards",
    paragraphs: ["Submitted evidence must:"],
    listItems: [
      "be from participant POV;",
      "clearly show gameplay;",
      "remain substantially unedited;",
      "accurately reflect events.",
    ],
    subsections: [
      {
        title: "",
        paragraphs: ["ArenaMC may reject evidence that appears:"],
        listItems: [
          "manipulated;",
          "misleading;",
          "intentionally cropped;",
          "excessively edited;",
          "incomplete;",
          "obstructed;",
          "fabricated.",
        ],
      },
      {
        title: "",
        paragraphs: [
          "Edited clips designed to omit context may result in immediate forfeiture.",
        ],
      },
    ],
  },
  {
    title: "9. Automatic Forfeiture Conditions",
    paragraphs: ["A participant may automatically forfeit a fight if they:"],
    subsections: [
      {
        title: "A. Leave the Arena",
        paragraphs: [
          "Intentionally abandoning the agreed fight area to avoid combat.",
        ],
      },
      {
        title: "B. Combat Log",
        paragraphs: ["Disconnecting or leaving during active combat."],
      },
      {
        title: "C. Fail Verification Requirements",
        paragraphs: ["Failing to properly show:"],
        codeBlocks: [["/police consent"]],
      },
      {
        title: "",
        paragraphs: ["or the assigned Fight ID."],
      },
      {
        title: "D. Refuse Evidence Submission",
        paragraphs: [
          "Failing to record your POV as required, or failing to submit required evidence after a dispute.",
        ],
      },
      {
        title: "E. Cheat or Manipulate",
        paragraphs: ["Including:"],
        listItems: [
          "exploit abuse;",
          "fake recordings;",
          "collusion;",
          "staged fights;",
          "intentionally throwing fights.",
        ],
      },
      {
        title: "F. No-Show",
        paragraphs: ["Failing to appear within the grace period."],
      },
    ],
  },
  {
    title: "10. Refund Policy",
    paragraphs: ["ArenaMC may issue refunds when:"],
    listItems: [
      "a fight never occurs;",
      "both parties agree to cancel;",
      "a no-fault technical issue prevents completion;",
      "evidence is inconclusive;",
      "administrators determine refund is appropriate.",
    ],
    subsections: [
      {
        title: "",
        paragraphs: [
          "Refunds are not guaranteed.",
          "ArenaMC reserves sole discretion regarding refund eligibility.",
        ],
      },
    ],
  },
  {
    title: "11. Inconclusive Outcomes",
    paragraphs: [
      "In rare cases where evidence is insufficient or conflicting, administrators may:",
    ],
    listItems: [
      "void the fight;",
      "split funds;",
      "refund both users;",
      "declare forfeiture;",
      "or determine a winner based on available information.",
    ],
    subsections: [
      {
        title: "",
        paragraphs: ["Administrative decisions are final."],
      },
    ],
  },
  {
    title: "12. Fraud Prevention",
    paragraphs: ["ArenaMC actively monitors for:"],
    listItems: [
      "staged fights;",
      "collusion;",
      "alt-account abuse;",
      "suspicious wagering;",
      "manipulated evidence;",
      "fake disputes;",
      "repeated bad-faith conduct.",
    ],
    subsections: [
      {
        title: "",
        paragraphs: ["ArenaMC may:"],
        listItems: [
          "freeze balances;",
          "reverse payouts;",
          "suspend participation;",
          "permanently ban accounts.",
        ],
      },
    ],
  },
  {
    title: "13. Wallet Adjustments",
    paragraphs: [
      "ArenaMC reserves the right to correct wallet balances in cases involving:",
    ],
    listItems: [
      "technical error;",
      "duplicated payouts;",
      "fraud;",
      "moderation reversal;",
      "administrative mistake.",
    ],
    subsections: [
      {
        title: "",
        paragraphs: [
          "Users may not intentionally retain funds received through platform error.",
        ],
      },
    ],
  },
  {
    title: "14. Final Authority",
    paragraphs: [
      "All escrow, dispute, payout, refund, and evidence decisions are made at ArenaMC’s sole discretion.",
      "By using ArenaMC, users acknowledge and agree that:",
    ],
    listItems: [
      "administrators may resolve disputes;",
      "administrative rulings are final;",
      "payouts may be delayed during review;",
      "escrow may remain locked during investigation.",
    ],
    subsections: [
      {
        title: "",
        paragraphs: ["ArenaMC is not obligated to reopen completed cases."],
      },
    ],
  },
  {
    title: "15. Good Faith Requirement",
    paragraphs: [
      "All participants are expected to act in good faith.",
      "ArenaMC is designed for fair, competitive, consensual PvP.",
      "Users who repeatedly abuse systems, exploit loopholes, or create unnecessary disputes may lose access to the Platform.",
    ],
  },
  {
    title: "16. Changes to This Policy",
    paragraphs: [
      "ArenaMC may update this Policy periodically.",
      "Continued use of the Platform after updates constitutes acceptance of the revised Policy.",
      "Users are responsible for reviewing the updated Policy.",
    ],
  },
];
