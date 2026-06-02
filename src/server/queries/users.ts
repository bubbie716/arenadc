import { prisma } from "@/lib/prisma";
import { getFighterStatsByUsername } from "@/server/queries/fighter-stats";

export async function getTopFighter() {
  const users = await prisma.user.findMany({
    where: { minecraftUsername: { not: null }, onboardingComplete: true },
    take: 20,
  });

  if (users.length === 0) return null;

  const withStats = await Promise.all(
    users.map(async (u) => {
      const stats = await getFighterStatsByUsername(u.minecraftUsername!);
      return {
        username: u.minecraftUsername!,
        stats,
        walletBalance: u.walletBalance,
      };
    }),
  );

  const ranked = withStats.sort((a, b) => {
    const winDiff = b.stats.record.wins - a.stats.record.wins;
    if (winDiff !== 0) return winDiff;
    return b.walletBalance - a.walletBalance;
  });

  const top = ranked[0];
  return {
    username: top.username,
    rank: 1,
    record: top.stats.record,
    winRate: top.stats.winRate,
    streak: top.stats.currentStreak,
    biggestWin: top.stats.totalEarnings,
  };
}

export async function getRankedFighterNames(): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { minecraftUsername: { not: null } },
    orderBy: { walletBalance: "desc" },
    take: 5,
    select: { minecraftUsername: true },
  });
  return users.map((u) => u.minecraftUsername!);
}
