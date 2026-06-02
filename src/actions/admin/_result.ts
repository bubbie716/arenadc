export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export function adminErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    switch (error.message) {
      case "ADMIN_REQUIRED":
        return "Admin access required.";
      case "UNAUTHORIZED":
        return "Sign in required.";
      case "NOTE_REQUIRED":
        return "An admin note (min. 3 characters) is required.";
      case "ALREADY_PROCESSED":
        return "This request was already processed.";
      case "FIGHT_ALREADY_SETTLED":
        return "Fight is already completed.";
      case "FIGHT_ALREADY_REFUNDED":
        return "Fight was already refunded.";
      case "WALLET_FROZEN":
        return "User wallet is frozen.";
      case "USER_SUSPENDED":
        return "User account is suspended.";
      default:
        return error.message;
    }
  }
  return "Action failed.";
}
