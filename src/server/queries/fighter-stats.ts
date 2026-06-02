import { FightStatus, WalletTransactionType } from "@prisma/client";
import type { FighterStats } from "@/lib/types";
import { prisma } from "@/lib/prisma";

const EMPTY_STATS: FighterStats = {
  record: { wins: 0, losses: 0 },
  winRate: 0,
  currentStreak: 0,
  totalEarnings: 0,
};

export async function getFighterStatsByUsername(
  minecraftUsername: string,
): Promise<FighterStats & { totalWagered: number }> {
  if (!minecraftUsername || minecraftUsername === "TBD") {
    return { ...EMPTY_STATS, totalWagered: 0 };
  }

  const user = await prisma.user.findFirst({
    where: {
      minecraftUsername: { equals: minecraftUsername, mode: "insensitive" },
    },
  });

  if (!user) {
    return { ...EMPTY_STATS, totalWagered: 0 };
  }

  const completedFights = await prisma.fight.findMany({
    where: {
      status: FightStatus.COMPLETED,
      winnerId: { not: null },
      OR: [{ playerAId: user.id }, { playerBId: user.id }],
    },
    orderBy: { scheduledAt: "desc" },
    select: { winnerId: true },
  });

  let wins = 0;
  let losses = 0;
  for (const fight of completedFights) {
    if (fight.winnerId === user.id) wins++;
    else losses++;
  }

  let currentStreak = 0;
  for (const fight of completedFights) {
    const won = fight.winnerId === user.id;
    if (currentStreak === 0) {
      currentStreak = won ? 1 : -1;
      continue;
    }
    if ((currentStreak > 0 && won) || (currentStreak < 0 && !won)) {
      currentStreak += won ? 1 : -1;
    } else {
      break;
    }
  }

  const total = wins + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 1000) / 10 : 0;

  const [wageredAgg, earningsAgg] = await Promise.all([
    prisma.fight.aggregate({
      where: {
        playerBId: { not: null },
        status: {
          notIn: [FightStatus.CANCELLED, FightStatus.DECLINED],
        },
        OR: [{ playerAId: user.id }, { playerBId: user.id }],
      },
      _sum: { wagerAmount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: { userId: user.id, type: WalletTransactionType.PAYOUT },
      _sum: { amount: true },
    }),
  ]);

  return {
    record: { wins, losses },
    winRate,
    currentStreak,
    totalEarnings: earningsAgg._sum.amount ?? 0,
    totalWagered: wageredAgg._sum.wagerAmount ?? 0,
  };
}
