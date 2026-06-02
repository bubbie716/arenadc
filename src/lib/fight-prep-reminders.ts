export type FightPrepContext = "create" | "accept";

export const FIGHT_PREP_PRE_FIGHT_STEPS = [
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
] as const;

export const FREE_FIGHT_PREP_STEPS = [
  {
    title: "Meet at the agreed fight location",
    detail: "Use the coordinates you set when scheduling. Free fights do not require POV recordings.",
  },
  {
    title: "Play it straight",
    detail:
      "Report wins and losses honestly. If you dispute a free fight, it counts as an automatic loss on your record.",
  },
] as const;

export const FIGHT_PREP_RULE_REMINDERS = [
  "Fight only in the agreed arena — leaving to avoid combat can mean automatic forfeiture.",
  "Equal wagers are escrowed on accept; do not expect to withdraw escrowed RMD during an active fight.",
  "If you disagree on the result, either fighter can mark the fight DISPUTED and submit POV proof within 15 minutes.",
  "Edited, incomplete, or missing recordings can result in forfeiture or denied payout.",
] as const;

export const FREE_FIGHT_PREP_REMINDERS = [
  "No POV recording is required for free fights.",
  "Disputing a free fight counts as an automatic loss on your record — your opponent gets the win.",
  "Fight only in the agreed location.",
  "Mutual confirmation (I Won / I Lost) is the fastest way to update records.",
] as const;

export function fightPrepIntro(context: FightPrepContext, isFreeFight: boolean): string {
  if (isFreeFight) {
    return context === "create"
      ? "You are about to create a free fight. No recording or escrow is required."
      : "You are about to accept this free fight. No RMD will be escrowed.";
  }
  if (context === "create") {
    return "You are about to create a wagered fight. Share these steps with your opponent and complete them before combat.";
  }
  return "You are about to accept this fight and lock your wager in escrow. Complete these steps before combat begins.";
}

export function getFightPrepSteps(isFreeFight: boolean) {
  return isFreeFight ? FREE_FIGHT_PREP_STEPS : FIGHT_PREP_PRE_FIGHT_STEPS;
}

export function getFightPrepReminders(isFreeFight: boolean) {
  return isFreeFight ? FREE_FIGHT_PREP_REMINDERS : FIGHT_PREP_RULE_REMINDERS;
}
