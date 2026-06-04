import { EscrowStatus, FightStatus, WalletTransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { formatFightPublicId } from "@/lib/fight-display";
import { getPlatformFeePercent } from "@/server/platform-settings";
import { TX_WAGER_LOSS } from "@/lib/wallet-tx-types";
import { postLedgerEntry } from "@/lib/wallet/ledger";
import { prisma } from "@/lib/prisma";
import {
  notifyFightResolved,
  notifyPayoutCompleted,
} from "@/server/notifications";
import { getScopedServerId } from "@/server/scope";

export async function refundFightEscrow(fightId: string, adminId?: string) {
  const serverId = await getScopedServerId();
  const fight = await prisma.fight.findFirstOrThrow({
    where: { id: fightId, serverId },
    select: { fightNumber: true, status: true },
  });

  if (fight.status === FightStatus.REFUNDED) {
    throw new Error("FIGHT_ALREADY_REFUNDED");
  }
  if (fight.status === FightStatus.COMPLETED) {
    throw new Error("FIGHT_ALREADY_SETTLED");
  }

  const fightLabel = formatFightPublicId(serverId, fight.fightNumber);
  const escrows = await prisma.escrow.findMany({
    where: { fightId, status: EscrowStatus.LOCKED },
  });

  if (escrows.length === 0) {
    await prisma.fight.update({
      where: { id: fightId },
      data: { status: FightStatus.REFUNDED },
    });
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const escrow of escrows) {
      await postLedgerEntry(tx, {
        userId: escrow.userId,
        type: WalletTransactionType.REFUND,
        amount: escrow.amount,
        description: `Refund — ${fightLabel}`,
        fightId,
        createdById: adminId ?? null,
      });
      await tx.escrow.update({
        where: { id: escrow.id },
        data: { status: EscrowStatus.REFUNDED },
      });
    }
    await tx.fight.update({
      where: { id: fightId },
      data: { status: FightStatus.REFUNDED },
    });
  });
}

export async function payoutFightWinner(
  fightId: string,
  winnerId: string,
  options?: { resolvedSummary?: string; adminId?: string },
) {
  const serverId = await getScopedServerId();
  const fight = await prisma.fight.findFirstOrThrow({ where: { id: fightId, serverId } });

  if (fight.status === FightStatus.COMPLETED) {
    throw new Error("FIGHT_ALREADY_SETTLED");
  }
  if (fight.status === FightStatus.REFUNDED) {
    throw new Error("FIGHT_ALREADY_REFUNDED");
  }

  const totalPot = fight.wagerAmount * 2;
  const platformFeePercent = await getPlatformFeePercent();
  const fee = Math.floor(totalPot * (platformFeePercent / 100));
  const payout = totalPot - fee;
  const resolvedSummary = options?.resolvedSummary ?? "Fight completed.";

  await prisma.$transaction(async (tx) => {
    const escrows = await tx.escrow.findMany({
      where: { fightId, status: EscrowStatus.LOCKED },
    });

    const fightLabel = formatFightPublicId(serverId, fight.fightNumber);

    for (const escrow of escrows) {
      await tx.escrow.update({
        where: { id: escrow.id },
        data: { status: EscrowStatus.RELEASED },
      });

      if (escrow.userId !== winnerId && fight.wagerAmount > 0) {
        const opponent =
          escrow.userId === fight.playerAId ? fight.playerBId : fight.playerAId;
        const opponentUser = opponent
          ? await tx.user.findFirst({
              where: { serverId, id: opponent },
              select: { minecraftUsername: true },
            })
          : null;
        const vs = opponentUser?.minecraftUsername
          ? ` vs ${opponentUser.minecraftUsername}`
          : "";

        await tx.walletTransaction.create({
          data: {
            serverId,
            userId: escrow.userId,
            type: TX_WAGER_LOSS,
            amount: -fight.wagerAmount,
            description: `Fight loss — ${fightLabel}${vs}`,
            fightId,
            createdById: options?.adminId ?? null,
          },
        });
      }
    }

    if (payout > 0) {
      await postLedgerEntry(tx, {
        userId: winnerId,
        type: WalletTransactionType.PAYOUT,
        amount: payout,
        description: `Victory payout — ${fightLabel}`,
        fightId,
        createdById: options?.adminId ?? null,
      });
    }

    await tx.fight.update({
      where: { id: fightId },
      data: {
        status: FightStatus.COMPLETED,
        winnerId,
        completedAt: new Date(),
      },
    });
  });

  if (payout > 0) {
    await notifyPayoutCompleted({
      winnerUserId: winnerId,
      fightId,
      fightNumber: fight.fightNumber,
      amount: payout,
    });
  }

  const fighterIds = [fight.playerAId, fight.playerBId].filter(
    (id): id is string => Boolean(id),
  );
  if (fighterIds.length > 0) {
    await notifyFightResolved({
      userIds: fighterIds,
      fightId,
      fightNumber: fight.fightNumber,
      summary: resolvedSummary,
    });
  }

  revalidatePath("/wallet");
  revalidatePath(`/fights/${fightId}`);
  revalidatePath("/admin");
  revalidatePath("/");
}
