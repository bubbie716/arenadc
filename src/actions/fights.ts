"use server";

import { revalidatePath } from "next/cache";
import { FightResultType, FightStatus, WalletTransactionType } from "@prisma/client";
import { formatFightDisplayId } from "@/lib/fight-display";
import { requireOnboardedUser, requireSessionUser } from "@/lib/auth/session";
import { assertCanParticipateInFight } from "@/lib/account-restrictions";
import { getResolvedPlatformSettings } from "@/server/platform-settings";
import { prisma } from "@/lib/prisma";
import {
  ACCEPTABLE_FIGHT_STATUSES,
  REPORTABLE_FIGHT_STATUSES,
} from "@/lib/fight-statuses";
import {
  notifyFightAccepted,
  notifyFightDeclined,
  notifyFightDisputed,
  notifyFightInvite,
  notifyFightResolved,
} from "@/server/notifications";
import { postLedgerEntry } from "@/lib/wallet/ledger";
import { payoutFightWinner, refundFightEscrow } from "@/server/fight-payout";
import { syncPastScheduledFights, tryFinalizeFightFromResults } from "@/server/fight-status";
import { normalizeFightLocation, validateFightLocation } from "@/lib/fight-location";
import { getDefaultArena } from "@/server/arenas";
import type { FormatId, RulesetId } from "@/lib/types";

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export async function createFight(input: {
  opponentMcName: string;
  isOpenChallenge: boolean;
  scheduledAt: string;
  ruleset: RulesetId;
  format: FormatId;
  fightLocation: string;
  wagerAmount: number;
}): Promise<ActionResult<{ fightId: string; fightNumber: number; displayId: string }>> {
  try {
    const user = await requireOnboardedUser();

    const platformSettings = await getResolvedPlatformSettings();
    if (!platformSettings.fightCreationEnabled) {
      return { ok: false, error: "Fight creation is temporarily disabled." };
    }

    const participation = assertCanParticipateInFight(user, input.wagerAmount);
    if (!participation.ok) {
      return { ok: false, error: participation.error };
    }

    if (input.wagerAmount < 0) {
      return { ok: false, error: "Wager cannot be negative." };
    }
    if (input.wagerAmount > 0 && input.wagerAmount < 100) {
      return { ok: false, error: "Minimum wager is 100 RMD (or choose Free)." };
    }

    const scheduledAt = new Date(input.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
      return { ok: false, error: "Schedule a future date and time." };
    }

    const locationError = validateFightLocation(input.fightLocation);
    if (locationError) {
      return { ok: false, error: locationError };
    }

    const defaultArena = await getDefaultArena();
    if (!defaultArena) {
      return { ok: false, error: "No arenas configured. Contact an admin." };
    }

    let resolvedOpponentName: string | null = null;
    let invitedOpponentId: string | null = null;

    if (!input.isOpenChallenge) {
      const opponentName = input.opponentMcName.trim();
      if (!opponentName) {
        return { ok: false, error: "Enter an opponent username or enable open challenge." };
      }
      if (opponentName.toLowerCase() === user.minecraftUsername?.toLowerCase()) {
        return { ok: false, error: "You cannot challenge yourself." };
      }

      const opponent = await prisma.user.findFirst({
        where: {
          minecraftUsername: { equals: opponentName, mode: "insensitive" },
          onboardingComplete: true,
        },
        select: {
          id: true,
          minecraftUsername: true,
          walletFrozen: true,
          suspendedAt: true,
        },
      });

      if (!opponent?.minecraftUsername) {
        return {
          ok: false,
          error: "This player is not signed up on ArenaMC yet.",
        };
      }

      if (opponent.suspendedAt) {
        return { ok: false, error: "This player's account is suspended." };
      }

      if (input.wagerAmount > 0 && opponent.walletFrozen) {
        return {
          ok: false,
          error: "This player's wallet is frozen and cannot join wager fights.",
        };
      }

      resolvedOpponentName = opponent.minecraftUsername;
      invitedOpponentId = opponent.id;
    }

    const initialStatus = input.isOpenChallenge
      ? FightStatus.OPEN
      : FightStatus.PENDING_ACCEPTANCE;

    const fight = await prisma.fight.create({
      data: {
        createdById: user.id,
        opponentMcName: input.isOpenChallenge ? null : resolvedOpponentName,
        isOpenChallenge: input.isOpenChallenge,
        ruleset: input.ruleset,
        format: input.format,
        arenaId: defaultArena.id,
        fightLocation: normalizeFightLocation(input.fightLocation),
        scheduledAt,
        wagerAmount: input.wagerAmount,
        status: initialStatus,
        playerAId: user.id,
      },
    });

    if (invitedOpponentId) {
      await notifyFightInvite({
        opponentUserId: invitedOpponentId,
        fightId: fight.id,
        fightNumber: fight.fightNumber,
        creatorName: user.minecraftUsername ?? "A fighter",
        wagerAmount: input.wagerAmount,
      });
    }

    revalidatePath("/");
    revalidatePath("/schedule");
    return {
      ok: true,
      data: {
        fightId: fight.id,
        fightNumber: fight.fightNumber,
        displayId: formatFightDisplayId(fight.fightNumber),
      },
    };
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return { ok: false, error: "Sign in required." };
    }
    if (e instanceof Error && e.message === "ONBOARDING_REQUIRED") {
      return { ok: false, error: "Complete onboarding first." };
    }
    return { ok: false, error: "Could not create fight." };
  }
}

export async function acceptFight(fightId: string): Promise<ActionResult> {
  try {
    const user = await requireOnboardedUser();

    const fight = await prisma.fight.findUnique({
      where: { id: fightId },
      include: { createdBy: true },
    });

    if (!fight || !ACCEPTABLE_FIGHT_STATUSES.includes(fight.status)) {
      return { ok: false, error: "This fight is not available to accept." };
    }

    if (fight.createdById === user.id) {
      return { ok: false, error: "You cannot accept your own challenge." };
    }

    if (!fight.isOpenChallenge) {
      const expected = fight.opponentMcName?.toLowerCase();
      if (expected !== user.minecraftUsername?.toLowerCase()) {
        return { ok: false, error: "This challenge was sent to another player." };
      }
    }

    const creator = await prisma.user.findUniqueOrThrow({
      where: { id: fight.createdById },
    });

    const hasWager = fight.wagerAmount > 0;

    const accepterCheck = assertCanParticipateInFight(user, fight.wagerAmount);
    if (!accepterCheck.ok) {
      return { ok: false, error: accepterCheck.error };
    }

    const creatorCheck = assertCanParticipateInFight(creator, fight.wagerAmount);
    if (!creatorCheck.ok) {
      return {
        ok: false,
        error: hasWager
          ? "The fight creator can no longer participate in wager fights."
          : "The fight creator's account is restricted.",
      };
    }

    if (hasWager) {
      if (user.walletBalance < fight.wagerAmount) {
        return {
          ok: false,
          error: `Insufficient balance. You need ${fight.wagerAmount.toLocaleString()} RMD.`,
        };
      }

      if (creator.walletBalance < fight.wagerAmount) {
        return { ok: false, error: "Creator no longer has enough RMD for this wager." };
      }
    }

    await prisma.$transaction(async (tx) => {
      if (hasWager) {
        const fightLabel = formatFightDisplayId(fight.fightNumber);

        for (const [fighter, label] of [
          [creator, fight.createdBy.minecraftUsername],
          [user, user.minecraftUsername],
        ] as const) {
          await postLedgerEntry(tx, {
            userId: fighter.id,
            type: WalletTransactionType.ESCROW_LOCK,
            amount: -fight.wagerAmount,
            description: `Escrow lock — ${fightLabel} vs ${label}`,
            fightId: fight.id,
          });
          await tx.escrow.create({
            data: {
              fightId: fight.id,
              userId: fighter.id,
              amount: fight.wagerAmount,
            },
          });
        }
      }

      await tx.fight.update({
        where: { id: fightId },
        data: {
          status: FightStatus.SCHEDULED,
          playerAId: creator.id,
          playerBId: user.id,
          opponentMcName: user.minecraftUsername,
        },
      });
    });

    await notifyFightAccepted({
      creatorUserId: creator.id,
      fightId: fight.id,
      fightNumber: fight.fightNumber,
      accepterName: user.minecraftUsername ?? "A fighter",
      isOpenChallenge: fight.isOpenChallenge,
    });

    revalidatePath(`/fights/${fightId}`);
    revalidatePath("/");
    revalidatePath("/wallet");
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && (e.message === "UNAUTHORIZED" || e.message === "ONBOARDING_REQUIRED")) {
      return { ok: false, error: "Sign in and complete onboarding." };
    }
    return { ok: false, error: "Could not accept fight." };
  }
}

export async function declineFight(fightId: string): Promise<ActionResult> {
  try {
    const user = await requireOnboardedUser();

    const fight = await prisma.fight.findUnique({ where: { id: fightId } });
    if (!fight || fight.status !== FightStatus.PENDING_ACCEPTANCE) {
      return { ok: false, error: "This fight cannot be declined." };
    }

    if (fight.createdById === user.id) {
      return { ok: false, error: "Use cancel instead of decline for your own challenge." };
    }

    if (!fight.isOpenChallenge) {
      const expected = fight.opponentMcName?.toLowerCase();
      if (expected !== user.minecraftUsername?.toLowerCase()) {
        return { ok: false, error: "This challenge was sent to another player." };
      }
    }

    await prisma.fight.update({
      where: { id: fightId },
      data: { status: FightStatus.DECLINED },
    });

    await notifyFightDeclined({
      creatorUserId: fight.createdById,
      fightId: fight.id,
      fightNumber: fight.fightNumber,
      declinerName: user.minecraftUsername ?? "A fighter",
    });

    revalidatePath(`/fights/${fightId}`);
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not decline fight." };
  }
}

export async function reportFightResult(
  fightId: string,
  result: "won" | "lost" | "dispute",
): Promise<ActionResult> {
  try {
    const user = await requireSessionUser();
    const fight = await prisma.fight.findUnique({ where: { id: fightId } });

    if (!fight) return { ok: false, error: "Fight not found." };
    if (fight.playerAId !== user.id && fight.playerBId !== user.id) {
      return { ok: false, error: "Only fighters can report results." };
    }

    await syncPastScheduledFights();

    if (!REPORTABLE_FIGHT_STATUSES.includes(fight.status)) {
      return { ok: false, error: "This fight cannot accept result reports." };
    }

    const typeMap: Record<typeof result, FightResultType> = {
      won: FightResultType.WIN,
      lost: FightResultType.LOSS,
      dispute: FightResultType.DISPUTE,
    };

    const existing = await prisma.fightResult.findUnique({
      where: {
        fightId_reportedById: { fightId, reportedById: user.id },
      },
    });
    if (existing) {
      return { ok: false, error: "You already reported your result. It cannot be changed." };
    }

    await prisma.fightResult.create({
      data: {
        fightId,
        reportedById: user.id,
        type: typeMap[result],
      },
    });

    if (result === "dispute") {
      if (fight.wagerAmount === 0) {
        const opponentId =
          user.id === fight.playerAId ? fight.playerBId : fight.playerAId;
        if (!opponentId) {
          return { ok: false, error: "Opponent not set." };
        }
        await payoutFightWinner(fightId, opponentId, {
          resolvedSummary:
            "Free fight disputed — automatic loss for the disputing fighter.",
        });
      } else {
        await prisma.fight.update({
          where: { id: fightId },
          data: { status: FightStatus.AWAITING_RECORDINGS },
        });
        const fighterIds = [fight.playerAId, fight.playerBId].filter(
          (id): id is string => Boolean(id),
        );
        if (fighterIds.length > 0) {
          await notifyFightDisputed({
            userIds: fighterIds,
            fightId,
            fightNumber: fight.fightNumber,
          });
        }
      }
    } else {
      const finalize = await tryFinalizeFightFromResults(fightId);
      if (finalize?.shouldPayout && finalize.winnerId) {
        await payoutFightWinner(fightId, finalize.winnerId);
      } else {
        await prisma.fight.update({
          where: { id: fightId },
          data: { status: FightStatus.AWAITING_RESULT },
        });
      }
    }

    revalidatePath(`/fights/${fightId}`);
    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not submit result." };
  }
}

export async function adminUpdateFightStatus(
  fightId: string,
  action: "cancel" | "pay_a" | "pay_b" | "refund" | "dispute",
): Promise<ActionResult> {
  try {
    const user = await requireSessionUser();
    if (!user.isAdmin) return { ok: false, error: "Admin only." };

    const fight = await prisma.fight.findUnique({ where: { id: fightId } });
    if (!fight) return { ok: false, error: "Fight not found." };

    if (action === "dispute") {
      await prisma.fight.update({
        where: { id: fightId },
        data: { status: FightStatus.AWAITING_RECORDINGS },
      });
    } else if (action === "cancel") {
      await prisma.fight.update({
        where: { id: fightId },
        data: { status: FightStatus.CANCELLED },
      });
    } else if (action === "refund") {
      await refundFightEscrow(fightId);
      await prisma.fight.update({
        where: { id: fightId },
        data: { status: FightStatus.REFUNDED },
      });
      const fighterIds = [fight.playerAId, fight.playerBId].filter(
        (id): id is string => Boolean(id),
      );
      if (fighterIds.length > 0) {
        await notifyFightResolved({
          userIds: fighterIds,
          fightId,
          fightNumber: fight.fightNumber,
          summary: "Fight refunded by admin.",
        });
      }
    } else if (action === "pay_a" || action === "pay_b") {
      const winnerId = action === "pay_a" ? fight.playerAId : fight.playerBId;
      if (!winnerId) return { ok: false, error: "Fighter not set." };
      await payoutFightWinner(fightId, winnerId, {
        resolvedSummary: "Admin resolved dispute.",
      });
    }

    revalidatePath("/admin");
    revalidatePath(`/fights/${fightId}`);
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, error: "Admin action failed." };
  }
}
