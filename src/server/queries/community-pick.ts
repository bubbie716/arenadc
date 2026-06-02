import { CommunityPickSide, FightStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CommunityPick } from "@/lib/types";

const CLOSED_STATUSES: FightStatus[] = [
  FightStatus.COMPLETED,
  FightStatus.CANCELLED,
  FightStatus.REFUNDED,
  FightStatus.DECLINED,
  FightStatus.DRAFT,
];

export type CommunityPickData = CommunityPick & {
  totalVotes: number;
  userVote: "a" | "b" | null;
  canVote: boolean;
};

export async function getCommunityPickForFight(
  fightId: string,
  viewerUserId?: string | null,
): Promise<CommunityPickData> {
  const fight = await prisma.fight.findUnique({
    where: { id: fightId },
    select: { status: true },
  });

  const [votesForA, votesForB, userVoteRow] = await Promise.all([
    prisma.fightCommunityVote.count({
      where: { fightId, side: CommunityPickSide.PLAYER_A },
    }),
    prisma.fightCommunityVote.count({
      where: { fightId, side: CommunityPickSide.PLAYER_B },
    }),
    viewerUserId
      ? prisma.fightCommunityVote.findUnique({
          where: { fightId_userId: { fightId, userId: viewerUserId } },
          select: { side: true },
        })
      : null,
  ]);

  const totalVotes = votesForA + votesForB;
  const playerAPercent =
    totalVotes === 0 ? 50 : Math.round((votesForA / totalVotes) * 100);
  const playerBPercent = totalVotes === 0 ? 50 : 100 - playerAPercent;

  const userVote =
    userVoteRow?.side === CommunityPickSide.PLAYER_A
      ? "a"
      : userVoteRow?.side === CommunityPickSide.PLAYER_B
        ? "b"
        : null;

  const canVote = Boolean(
    viewerUserId && fight && !CLOSED_STATUSES.includes(fight.status),
  );

  return {
    fightId,
    playerAPercent,
    playerBPercent,
    totalVotes,
    userVote,
    canVote,
  };
}
