/** Allow fighters to predict on their own fight (opt-in via env only). */
export function allowFighterSpectatorBets(): boolean {
  return process.env.ALLOW_FIGHTER_SPECTATOR_BETS === "true";
}

/** Allow one prediction per side per user (opt-in via env only). */
export function allowMultipleSpectatorBetsPerUser(): boolean {
  return process.env.ALLOW_FIGHTER_SPECTATOR_BETS === "true";
}
