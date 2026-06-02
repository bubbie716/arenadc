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

export const FIGHT_PREP_RULE_REMINDERS = [
  "Fight only in the agreed arena — leaving to avoid combat can mean automatic forfeiture.",
  "Equal wagers are escrowed on accept; do not expect to withdraw escrowed RMD during an active fight.",
  "If you disagree on the result, either fighter can mark the fight DISPUTED and submit POV proof within 15 minutes.",
  "Edited, incomplete, or missing recordings can result in forfeiture or denied payout.",
] as const;

export function fightPrepIntro(context: FightPrepContext): string {
  if (context === "create") {
    return "You are about to create a wagered fight. Share these steps with your opponent and complete them before combat.";
  }
  return "You are about to accept this fight and lock your wager in escrow. Complete these steps before combat begins.";
}
