"use server";

import { revalidatePath } from "next/cache";
import { assertCanParticipateInFight } from "@/lib/account-restrictions";
import { getActiveServerConfig } from "@/lib/server-context";
import { formatCurrency } from "@/lib/utils";
import { requireOnboardedUser } from "@/lib/auth/session";
import { placeSpectatorBet as placeBet } from "@/server/spectator-betting";
import type { ActionResult } from "@/actions/fights";

export async function placeSpectatorBet(input: {
  fightId: string;
  selectedFighterId: string;
  amount: number;
}): Promise<ActionResult> {
  try {
    const user = await requireOnboardedUser();
    const config = await getActiveServerConfig();

    const participation = assertCanParticipateInFight(user, input.amount);
    if (!participation.ok) {
      return { ok: false, error: participation.error };
    }

    if (input.amount < 100) {
      return {
        ok: false,
        error: `Minimum prediction is ${formatCurrency(100, config)}.`,
      };
    }

    await placeBet({
      fightId: input.fightId,
      userId: user.id,
      selectedFighterId: input.selectedFighterId,
      amount: input.amount,
    });

    revalidatePath(`/fights/${input.fightId}`);
    revalidatePath("/");
    revalidatePath("/wallet");
    return { ok: true };
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    if (code === "INSUFFICIENT_BALANCE") {
      const config = await getActiveServerConfig();
      return {
        ok: false,
        error: `Insufficient balance. You need ${formatCurrency(input.amount, config)} available.`,
      };
    }
    if (code === "BETTING_CLOSED") {
      return { ok: false, error: "Prediction pool is locked." };
    }
    if (code === "FIGHTER_CANNOT_BET") {
      return { ok: false, error: "Fighters cannot predict on their own fight." };
    }
    if (code === "ALREADY_BET") {
      return { ok: false, error: "You already have a prediction on this fight." };
    }
    if (code === "MIN_BET") {
      const config = await getActiveServerConfig();
      return {
        ok: false,
        error: `Minimum prediction is ${formatCurrency(100, config)}.`,
      };
    }
    return { ok: false, error: "Could not place prediction." };
  }
}
