import type { LegalSection } from "@/lib/legal/types";

export const PRIVACY_POLICY_SECTIONS: LegalSection[] = [
  {
    title: "1. Information We Collect",
    paragraphs: [
      "ArenaMC collects only the information reasonably necessary to operate the Platform.",
    ],
    subsections: [
      {
        title: "A. Account Information",
        paragraphs: [
          "When signing in through Discord, we may collect:",
          "We use Discord authentication solely for account access, moderation, and platform functionality.",
          "ArenaMC does not collect Discord passwords.",
        ],
        listItems: [
          "Discord User ID",
          "Discord username",
          "Discord display name",
          "Discord avatar",
          "Discord account metadata provided through OAuth",
        ],
      },
      {
        title: "B. Minecraft Information",
        paragraphs: ["We may collect:"],
        listItems: [
          "Minecraft username",
          "linked in-game identity",
          "fight participation history",
          "associated ArenaMC records",
        ],
      },
      {
        title: "",
        paragraphs: ["This information is used to:"],
        listItems: [
          "identify fighters,",
          "verify participation,",
          "track competitive records,",
          "and operate platform functionality.",
        ],
      },
      {
        title: "C. Platform Activity Data",
        paragraphs: [
          "ArenaMC may store information related to platform usage, including:",
          "This information helps us operate and improve the Platform.",
        ],
        listItems: [
          "scheduled fights",
          "fight results",
          "wagers",
          "escrow activity",
          "payouts",
          "dispute history",
          "moderation actions",
          "rankings",
          "profile statistics",
          "fight invitations",
          "notifications",
        ],
      },
      {
        title: "D. Evidence & Recording Links",
        paragraphs: [
          "When disputes occur, users may submit evidence links.",
          "ArenaMC may collect:",
        ],
        listItems: [
          "submitted URLs;",
          "timestamps;",
          "moderation notes;",
          "dispute outcomes.",
        ],
      },
      {
        title: "",
        paragraphs: [
          "Evidence links may include third-party platforms such as:",
          "Users are responsible for understanding the privacy policies of third-party platforms.",
          "ArenaMC does not control how those services process uploaded recordings.",
        ],
        listItems: [
          "YouTube",
          "Medal",
          "Streamable",
          "Imgur",
          "Discord-hosted recordings",
          "Google Drive",
        ],
      },
      {
        title: "E. Technical Information",
        paragraphs: ["We may automatically collect limited technical information such as:"],
        listItems: [
          "browser type",
          "device information",
          "operating system",
          "IP address",
          "timestamps",
          "platform activity logs",
          "error logs",
        ],
      },
      {
        title: "",
        paragraphs: ["This information may be used to:"],
        listItems: [
          "improve performance,",
          "prevent fraud,",
          "investigate abuse,",
          "secure accounts,",
          "and diagnose technical issues.",
        ],
      },
    ],
  },
  {
    title: "2. How We Use Information",
    paragraphs: ["ArenaMC uses collected information to:"],
    listItems: [
      "operate the Platform;",
      "create and manage accounts;",
      "authenticate users through Discord;",
      "process wagers and escrow;",
      "manage fights and disputes;",
      "provide notifications;",
      "moderate abuse;",
      "detect fraud or suspicious activity;",
      "improve platform reliability;",
      "maintain rankings and fight history;",
      "communicate platform updates.",
    ],
    subsections: [
      {
        title: "",
        paragraphs: ["We only use information for legitimate platform-related purposes."],
      },
    ],
  },
  {
    title: "3. Fraud Prevention & Security",
    paragraphs: [
      "To preserve platform integrity, ArenaMC may use account information and platform activity to:",
    ],
    listItems: [
      "detect collusion;",
      "investigate staged fights;",
      "identify abuse;",
      "investigate suspicious wagering;",
      "enforce moderation decisions;",
      "prevent account manipulation.",
    ],
    subsections: [
      {
        title: "",
        paragraphs: [
          "ArenaMC reserves the right to monitor platform activity reasonably necessary to maintain fairness and security.",
        ],
      },
    ],
  },
  {
    title: "4. Sharing of Information",
    paragraphs: [
      "ArenaMC does not sell personal information.",
      "We may share limited information only:",
    ],
    subsections: [
      {
        title: "A. Public Platform Features",
        paragraphs: ["Certain information may be publicly displayed, including:"],
        listItems: [
          "Minecraft username",
          "fight history",
          "rankings",
          "wins/losses",
          "streaks",
          "profile statistics",
          "completed fight results",
        ],
      },
      {
        title: "",
        paragraphs: [
          "This information is part of the competitive nature of the Platform.",
        ],
      },
      {
        title: "B. Moderation & Enforcement",
        paragraphs: ["Information may be reviewed internally by administrators for:"],
        listItems: [
          "disputes,",
          "fraud investigations,",
          "moderation,",
          "rule enforcement,",
          "payout decisions.",
        ],
      },
      {
        title: "C. Legal or Safety Reasons",
        paragraphs: ["ArenaMC may disclose information if reasonably necessary to:"],
        listItems: [
          "comply with applicable law;",
          "protect platform integrity;",
          "investigate abuse;",
          "protect user safety;",
          "prevent fraud.",
        ],
      },
    ],
  },
  {
    title: "5. Data Retention",
    paragraphs: ["ArenaMC may retain information for as long as reasonably necessary to:"],
    listItems: [
      "maintain platform history;",
      "resolve disputes;",
      "prevent fraud;",
      "preserve rankings;",
      "enforce platform rules.",
    ],
    subsections: [
      {
        title: "",
        paragraphs: ["Certain information may remain after account closure where necessary for:"],
        listItems: [
          "fraud prevention,",
          "moderation history,",
          "completed fight records,",
          "accounting integrity,",
          "or platform security.",
        ],
      },
    ],
  },
  {
    title: "6. Account Deletion",
    paragraphs: ["Users may request account deletion.", "However, ArenaMC may retain limited records necessary for:"],
    listItems: [
      "fraud prevention;",
      "dispute history;",
      "moderation actions;",
      "financial ledger integrity;",
      "completed fight records.",
    ],
    subsections: [
      {
        title: "",
        paragraphs: [
          "Deleting an account may not remove public fight history already associated with completed fights.",
        ],
      },
    ],
  },
  {
    title: "7. Third-Party Services",
    paragraphs: [
      "ArenaMC may rely on third-party providers, including but not limited to:",
      "Use of third-party services may involve separate privacy policies outside ArenaMC’s control.",
    ],
    listItems: [
      "Discord authentication",
      "hosting providers",
      "database providers",
      "analytics tools",
      "media hosting services",
      "notification providers",
    ],
    subsections: [
      {
        title: "",
        paragraphs: ["Examples may include:"],
        listItems: [
          "Discord",
          "Neon",
          "Vercel",
          "Upload services",
          "Video hosting platforms",
        ],
      },
    ],
  },
  {
    title: "8. Security",
    paragraphs: [
      "ArenaMC takes reasonable measures to protect user information.",
      "However, no platform can guarantee complete security.",
      "Users acknowledge that:",
    ],
    listItems: [
      "internet transmissions may not be fully secure;",
      "third-party services may experience failures;",
      "no system is entirely immune to unauthorized access.",
    ],
    subsections: [
      {
        title: "",
        paragraphs: ["Users are responsible for maintaining account security."],
      },
    ],
  },
  {
    title: "9. Children & Minors",
    paragraphs: [
      "ArenaMC is a community platform associated with online gaming environments that may include minors.",
      "By using the Platform, users represent that they have authority to use the service.",
      "Parents or guardians remain responsible for supervising minors where applicable.",
      "ArenaMC does not knowingly collect unnecessary personal information from minors.",
    ],
  },
  {
    title: "10. Cookies & Session Data",
    paragraphs: ["ArenaMC may use cookies or session technologies for:"],
    listItems: [
      "authentication;",
      "login persistence;",
      "platform preferences;",
      "security;",
      "notifications;",
      "user experience improvements.",
    ],
    subsections: [
      {
        title: "",
        paragraphs: ["Disabling cookies may limit Platform functionality."],
      },
    ],
  },
  {
    title: "11. Changes to This Privacy Policy",
    paragraphs: [
      "ArenaMC may update this Privacy Policy periodically.",
      "Continued use of the Platform after updates constitutes acceptance of the revised Privacy Policy.",
      "Users are responsible for reviewing the updated Privacy Policy.",
    ],
  },
  {
    title: "12. Contact",
    paragraphs: [
      "Questions about this Privacy Policy may be directed through the official ArenaMC Discord server.",
      "By using ArenaMC, you acknowledge that you have read and understood this Privacy Policy.",
    ],
  },
];
