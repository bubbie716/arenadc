import type { ServerConfig } from "@/lib/server-config";
import { formatFightPublicId } from "@/lib/fight-display";

export type FightPrepContext = "create" | "accept";

export type FightPrepStep = {
  title: string;
  detail: string;
  code?: string;
};

const GOVERNMENT_PRE_FIGHT_STEPS: FightPrepStep[] = [
  {
    title: "Start your POV recording",
    detail:
      "Required for every wagered fight. Start recording before anything else and keep it running through the outcome.",
  },
  {
    title: "Type /police consent",
    detail: "Both fighters must run this in-game before combat. It must be visible in your POV recording.",
    code: "/police consent",
  },
  {
    title: "Type the Fight ID in local chat",
    detail:
      "Use the Fight ID from your ArenaMC fight page before the fight begins. It must be visible in your POV recording.",
    code: "Fight ID",
  },
];

function openworldPreFightSteps(): FightPrepStep[] {
  return [
    {
      title: "Start your POV recording",
      detail:
        "Start recording before anything else and keep it running through the outcome. Your recording must show the Fight ID in local chat and all combat.",
    },
    {
      title: "Type the Fight ID in local chat",
      detail:
        "Both fighters must type the assigned Fight ID in local chat before combat. It must be clearly visible in your POV recording.",
      code: "Fight ID",
    },
    {
      title: "Meet at the agreed arena",
      detail:
        "Both fighters must be present at the scheduled arena or location before combat begins.",
    },
  ];
}

const FREE_FIGHT_PREP_STEPS: FightPrepStep[] = [
  {
    title: "Meet at the agreed fight location",
    detail: "Use the coordinates you set when scheduling. Free fights do not require POV recordings.",
  },
  {
    title: "Play it straight",
    detail:
      "Report wins and losses honestly. If you dispute a free fight, it counts as an automatic loss on your record.",
  },
];

function governmentRuleReminders(currencyCode: string): string[] {
  return [
    "Fight only in the agreed arena — leaving to avoid combat can mean automatic forfeiture.",
    `Equal wagers are escrowed on accept; do not expect to withdraw escrowed ${currencyCode} during an active fight.`,
    "If you disagree on the result, either fighter can mark the fight DISPUTED and submit POV proof within 15 minutes.",
    "Edited, incomplete, or missing recordings can result in forfeiture or denied payout.",
  ];
}

function openworldRuleReminders(currencyCode: string): string[] {
  return [
    "Fight only in the agreed arena — leaving to avoid combat can mean automatic forfeiture.",
    `Equal wagers are escrowed on accept; do not expect to withdraw escrowed ${currencyCode} during an active fight.`,
    "If you disagree on the result, either fighter can mark the fight DISPUTED and submit POV proof within 15 minutes.",
    "Third-party interference (healing, assisting, attacking fighters, supplying items, or disrupting the arena) may void the fight or trigger admin review.",
    "Edited, incomplete, or missing recordings can result in forfeiture or denied payout when disputes require evidence.",
  ];
}

const FREE_FIGHT_PREP_REMINDERS = [
  "No POV recording is required for free fights.",
  "Disputing a free fight counts as an automatic loss on your record — your opponent gets the win.",
  "Fight only in the agreed location.",
  "Mutual confirmation (I Won / I Lost) is the fastest way to update records.",
] as const;

export function fightPrepIntro(
  config: ServerConfig,
  context: FightPrepContext,
  isFreeFight: boolean,
): string {
  if (isFreeFight) {
    return context === "create"
      ? "You are about to create a free fight. No recording or escrow is required."
      : `You are about to accept this free fight. No ${config.currencyCode} will be escrowed.`;
  }
  if (context === "create") {
    return "You are about to create a wagered fight. Share these steps with your opponent and complete them before combat.";
  }
  return "You are about to accept this fight and lock your wager in escrow. Complete these steps before combat begins.";
}

export function getFightPrepSteps(config: ServerConfig, isFreeFight: boolean): FightPrepStep[] {
  if (isFreeFight) return [...FREE_FIGHT_PREP_STEPS];
  if (config.rulesetKind === "government") return [...GOVERNMENT_PRE_FIGHT_STEPS];
  return openworldPreFightSteps();
}

export function getFightPrepReminders(config: ServerConfig, isFreeFight: boolean): string[] {
  if (isFreeFight) return [...FREE_FIGHT_PREP_REMINDERS];
  return config.rulesetKind === "openworld"
    ? openworldRuleReminders(config.currencyCode)
    : governmentRuleReminders(config.currencyCode);
}

/** Public fight ID for prep UI (e.g. ArenaSW-0042). */
export function fightPrepPublicId(
  config: ServerConfig,
  fightNumber?: number | null,
): string | null {
  if (fightNumber == null || fightNumber < 1) return null;
  return formatFightPublicId(config.id, fightNumber);
}
