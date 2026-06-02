"use server";

import { revalidatePath } from "next/cache";
import { CommunityPickSide, FightStatus } from "@prisma/client";
import type { ActionResult } from "@/actions/fights";
import { requireOnboardedUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const CLOSED_STATUSES: FightStatus[] = [
  FightStatus.COMPLETED,
  FightStatus.CANCELLED,
  FightStatus.REFUNDED,
  FightStatus.DECLINED,
  FightStatus.DRAFT,
];

export async function voteCommunityPick(
  fightId: string,
  side: "a" | "b",
): Promise<ActionResult> {
  try {
    const user = await requireOnboardedUser();
    if (user.suspendedAt) {
      return { ok: false, error: "Your account is suspended." };
    }

    const fight = await prisma.fight.findUnique({
      where: { id: fightId },
      select: { status: true, playerBId: true },
    });
    if (!fight) {
      return { ok: false, error: "Fight not found." };
    }
    if (!fight.playerBId) {
      return { ok: false, error: "Voting opens once both fighters are set." };
    }
    if (CLOSED_STATUSES.includes(fight.status)) {
      return { ok: false, error: "Voting is closed for this fight." };
    }

    const pickSide =
      side === "a" ? CommunityPickSide.PLAYER_A : CommunityPickSide.PLAYER_B;

    await prisma.fightCommunityVote.upsert({
      where: { fightId_userId: { fightId, userId: user.id } },
      create: { fightId, userId: user.id, side: pickSide },
      update: { side: pickSide },
    });

    revalidatePath(`/fights/${fightId}`);
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return { ok: false, error: "Sign in to vote." };
    }
    if (e instanceof Error && e.message === "ONBOARDING_REQUIRED") {
      return { ok: false, error: "Complete onboarding to vote." };
    }
    return { ok: false, error: "Could not record your vote." };
  }
}
