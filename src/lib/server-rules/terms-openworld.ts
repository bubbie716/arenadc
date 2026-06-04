import type { LegalSection } from "@/lib/legal/types";

export const TERMS_OPENWORLD_SECTIONS: LegalSection[] = [
  {
    title: "1. Eligibility",
    paragraphs: [
      "To use ArenaMC, you must:",
      "By using ArenaMC, you represent that the information you provide is accurate and that you will not impersonate another user or misrepresent your identity.",
      "ArenaMC reserves the right to suspend, restrict, or terminate accounts at any time for suspected fraud, abuse, impersonation, ban evasion, or violations of these Terms.",
    ],
    listItems: [
      "Have a valid Discord account;",
      "Have a valid Minecraft account and associated Stoneworks username;",
      "Comply with all applicable Stoneworks server rules and policies;",
      "Have authority to agree to these Terms.",
    ],
  },
  {
    title: "2. Community Platform Disclaimer",
    paragraphs: [
      "ArenaMC is an independent community platform created for competitive Minecraft gameplay and scheduled open-world PvP matches.",
      "ArenaMC:",
      "Users remain responsible for complying with all Stoneworks rules and any server-specific policies.",
    ],
    listItems: [
      "is not affiliated with, endorsed by, or operated by Mojang, Microsoft, or Stoneworks, unless explicitly stated otherwise;",
      "does not issue or control Stoneworks currency;",
      "operates solely as a platform for users to voluntarily arrange and participate in competitive in-game matches.",
    ],
  },
  {
    title: "3. No Real-Money Gambling",
    paragraphs: [
      "ArenaMC uses SWC, an in-game virtual currency, for platform activity.",
      "Users acknowledge and agree that:",
      "ArenaMC does not offer casino gambling, sports betting, or real-money wagering.",
      "Any fighter wagers facilitated by the Platform are strictly peer-to-peer, voluntary, competitive in-game challenges between users involving in-game currency.",
    ],
    listItems: [
      "SWC is not real-world currency;",
      "SWC has no cash value on ArenaMC;",
      "ArenaMC does not convert, redeem, exchange, or cash out SWC into United States Dollars or any real-world monetary equivalent;",
      "participation on the Platform is intended solely for in-game entertainment and competitive gameplay purposes.",
    ],
  },
  {
    title: "4. Competitive PvP Participation",
    paragraphs: [
      "By participating in an ArenaMC fight, users voluntarily agree to the scheduled competitive PvP match and its agreed ruleset.",
      "Users acknowledge that:",
      "Users waive and release any claims against opposing participants arising solely from competitive PvP conducted in accordance with agreed fight rules, Stoneworks rules, and ArenaMC procedures.",
      "For clarity, this includes voluntary in-game combat losses resulting from properly scheduled ArenaMC fights.",
      "Nothing in these Terms waives rights relating to fraud, harassment, impersonation, platform abuse, or violations of Stoneworks rules.",
    ],
    listItems: [
      "Participation is voluntary;",
      "Scheduled fights are competitive PvP matches;",
      "Users knowingly accept the risks of losing in-game items, currency, or competitive outcomes permitted under Stoneworks rules;",
      "Users agree to compete pursuant to the agreed fight conditions.",
    ],
  },
  {
    title: "5. Required Fight Procedures",
    paragraphs: [
      "For any wagered fight facilitated through ArenaMC, users must comply with all required procedures.",
      "Before a fight begins:",
    ],
    subsections: [
      {
        title: "A. Recording Requirement",
        paragraphs: [
          "Both fighters must start POV recording before any other pre-fight step and keep recording through the outcome.",
          "POV becomes mandatory when a dispute occurs, results are disputed, or admin review is needed.",
          "Recordings must clearly show the Fight ID typed in local chat, combat, and the outcome.",
          "If a dispute arises, fighters must promptly submit their POV recording link. Failure to provide required evidence may result in forfeiture.",
        ],
      },
      {
        title: "B. Fight Identification Requirement",
        paragraphs: [
          "Before a fight begins, both participants must visibly type the assigned Fight ID into local in-game chat while recording.",
          "The Fight ID must be visible in POV recordings when evidence is required for disputes or admin review.",
          "This requirement exists to verify identity, verify the correct fight, prevent fraudulent submissions, prevent replay manipulation, and assist dispute review.",
          "Failure to properly display the Fight ID in your recording may result in forfeiture or administrative action.",
        ],
      },
      {
        title: "C. Arena Presence",
        paragraphs: [
          "Both fighters must be present at the agreed arena or location before combat begins.",
          "Failure to appear within the scheduled window may result in no-show forfeiture or administrative action.",
        ],
      },
    ],
  },
  {
    title: "6. Escrow and Wagers",
    paragraphs: [
      "ArenaMC facilitates equal matched fighter wagers only.",
      "By creating or accepting a wagered fight, users authorize ArenaMC to temporarily escrow the wager amount associated with that fight.",
      "Users acknowledge:",
      "Upon completion of an eligible fight, the winning participant receives the wager pot minus applicable platform fees. ArenaMC retains a platform fee currently set at 10%, unless otherwise disclosed.",
      "ArenaMC reserves the right to modify fees at any time.",
      "If a fight is cancelled, invalidated, or refunded, escrowed amounts may be returned at ArenaMC's discretion.",
    ],
    listItems: [
      "wager amounts must match equally between fighters;",
      "escrowed funds may be temporarily locked;",
      "funds may not be withdrawn during active escrow;",
      "payouts are contingent upon fight completion or dispute resolution.",
    ],
  },
  {
    title: "7. Administrative Authority and Final Decisions",
    paragraphs: [
      "Users expressly acknowledge and agree that ArenaMC administrators maintain final authority regarding disputes, payouts, forfeitures, cancellations, evidence review, misconduct, refunds, account restrictions, fight eligibility, and platform moderation.",
      "ArenaMC may, in its sole discretion:",
      "Administrative decisions are final.",
      "ArenaMC is not obligated to reconsider or reopen resolved disputes.",
    ],
    listItems: [
      "determine a winner,",
      "declare forfeiture,",
      "void a fight,",
      "refund escrow,",
      "reject evidence,",
      "restrict participation,",
      "suspend accounts,",
      "or permanently terminate access.",
    ],
  },
  {
    title: "8. Fraud, Abuse, and Manipulation",
    paragraphs: [
      "Users may not:",
      "ArenaMC reserves the right to freeze funds, suspend accounts, reverse payouts, or permanently ban users suspected of fraud or manipulation.",
      "Any attempt to abuse the Platform may result in immediate termination.",
    ],
    listItems: [
      "submit edited or misleading evidence;",
      "impersonate other players;",
      "intentionally manipulate fight outcomes;",
      "collude to abuse wagers;",
      "engage in account sharing;",
      "evade platform restrictions;",
      "create fraudulent disputes;",
      "exploit bugs or technical issues;",
      "abuse moderation systems.",
    ],
  },
  {
    title: "9. Limitation of Liability",
    paragraphs: [
      "To the fullest extent permitted by law, ArenaMC and its operators shall not be liable for lost in-game currency, lost in-game items, failed wagers, server issues, Stoneworks moderation actions, downtime, technical errors, delayed payouts, user misconduct, recording failures, or disputes between users.",
      'The Platform is provided "as is" and "as available."',
      "ArenaMC makes no guarantees regarding uninterrupted operation, uptime, payout timing, or platform availability.",
    ],
  },
  {
    title: "10. Account Suspension and Termination",
    paragraphs: [
      "ArenaMC may suspend, restrict, or terminate accounts at any time, with or without notice, for Terms violations, fraud, harassment, cheating, abuse, wallet misuse, or conduct harmful to the Platform or community.",
      "ArenaMC may restrict wallet access or escrow functionality during investigations.",
      "Users do not possess an ownership interest in platform accounts.",
    ],
  },
  {
    title: "11. Changes to These Terms",
    paragraphs: [
      "ArenaMC may update these Terms periodically.",
      "Continued use of the Platform after updates constitutes acceptance of the revised Terms.",
      "Users are responsible for reviewing updated Terms.",
    ],
  },
  {
    title: "12. Contact",
    paragraphs: [
      "Questions regarding these Terms may be directed through the official ArenaMC Discord server.",
      "By using ArenaMC, you acknowledge that you have read, understood, and agreed to these Terms of Service.",
    ],
  },
];
