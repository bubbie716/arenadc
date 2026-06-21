import { buildFightDisplayFields } from "@/lib/fight-display";
import { getPlatformFeePercent } from "@/server/platform-settings";
import { mapFightStatus } from "@/lib/mappers";
import type { FightStatus } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { getAdminSpectatorPoolStats } from "@/server/queries/spectator-betting";
import { getScopedServerId } from "@/server/scope";

export type AdminFightRow = {
  id: string;
  displayId: string;
  fightNumber: number;
  playerA: string;
  playerB: string;
  playerAId: string | null;
  playerBId: string | null;
  wagerAmount: number;
  totalPot: number;
  platformFee: number;
  winnerPayout: number;
  ruleset: string;
  format: string;
  arenaName: string;
  fightLocation: string | null;
  scheduledAt: string;
  status: FightStatus;
  winner: string | null;
  createdAt: string;
  spectatorBettingEnabled: boolean;
  spectatorBettingStatus: string;
  spectatorPoolTotal: number;
  spectatorBetCount: number;
  spectatorPoolA: number;
  spectatorPoolB: number;
};

export async function getAdminFights(): Promise<AdminFightRow[]> {
  const serverId = await getScopedServerId();
  const [fights, platformFeePercent] = await Promise.all([
    prisma.fight.findMany({
      where: { serverId },
      orderBy: { createdAt: "desc" },
      include: {
        playerA: { select: { minecraftUsername: true } },
        playerB: { select: { minecraftUsername: true } },
        createdBy: { select: { minecraftUsername: true } },
        arena: { select: { name: true } },
      },
    }),
    getPlatformFeePercent(),
  ]);

  return Promise.all(
    fights.map(async (fight) => {
      const playerAName =
        fight.playerA?.minecraftUsername ?? fight.createdBy.minecraftUsername ?? "Unknown";
      const playerBName =
        fight.playerB?.minecraftUsername ?? fight.opponentMcName ?? "TBD";
      let winner: string | null = null;
      if (fight.winnerId) {
        if (fight.playerAId === fight.winnerId) winner = playerAName;
        else if (fight.playerBId === fight.winnerId) winner = playerBName;
      }
      const totalPot = fight.wagerAmount * 2;
      const platformFee = Math.floor(totalPot * (platformFeePercent / 100));
      const { displayId, fightNumber } = buildFightDisplayFields(fight, serverId);
      const spectatorStats = fight.spectatorBettingEnabled
        ? await getAdminSpectatorPoolStats(fight.id)
        : null;

      return {
        id: fight.id,
        displayId,
        fightNumber,
        playerA: playerAName,
        playerB: playerBName,
        playerAId: fight.playerAId,
        playerBId: fight.playerBId,
        wagerAmount: fight.wagerAmount,
        totalPot,
        platformFee,
        winnerPayout: totalPot - platformFee,
        ruleset: fight.ruleset,
        format: fight.format,
        arenaName: fight.arena.name,
        fightLocation: fight.fightLocation,
        scheduledAt: fight.scheduledAt.toISOString(),
        status: mapFightStatus(fight.status),
        winner,
        createdAt: fight.createdAt.toISOString(),
        spectatorBettingEnabled: fight.spectatorBettingEnabled,
        spectatorBettingStatus: fight.spectatorBettingStatus,
        spectatorPoolTotal: spectatorStats?.totalPool ?? 0,
        spectatorBetCount: spectatorStats?.totalBets ?? 0,
        spectatorPoolA: spectatorStats?.poolA ?? 0,
        spectatorPoolB: spectatorStats?.poolB ?? 0,
      };
    }),
  );
}
