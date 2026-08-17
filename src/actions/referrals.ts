"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/actions/onboarding";
import { requireOnboardedUser } from "@/lib/auth/session";
import { ReferralError, setUserReferralCode } from "@/server/referrals";

export async function updateReferralCode(rawCode: string): Promise<ActionResult> {
  try {
    const user = await requireOnboardedUser();
    if (user.suspendedAt) {
      return { ok: false, error: "Your account is suspended." };
    }

    await setUserReferralCode(user.id, rawCode);
    revalidatePath("/referrals");
    return { ok: true };
  } catch (e) {
    if (e instanceof ReferralError) {
      return { ok: false, error: e.message };
    }
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return { ok: false, error: "Sign in to update your referral code." };
    }
    if (e instanceof Error && e.message === "ONBOARDING_REQUIRED") {
      return { ok: false, error: "Complete onboarding first." };
    }
    return { ok: false, error: "Could not update referral code." };
  }
}
