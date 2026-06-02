import { FightStatus } from "@prisma/client";
import { buildFightDisplayFields } from "@/lib/fight-display";
import { mapFightStatus } from "@/lib/mappers";
import { prisma } from "@/lib/prisma";

export async function getAdminDisputes() {
  const fights = await prisma.fight.findMany({
    where: {
      status: {
        in: [
          FightStatus.DISPUTED,
          FightStatus.AWAITING_RECORDINGS,
          FightStatus.AWAITING_RESULT,
        ],
      },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      playerA: { select: { minecraftUsername: true } },
      playerB: { select: { minecraftUsername: true } },
      createdBy: { select: { minecraftUsername: true } },
      arena: { select: { name: true } },
      evidenceSubmissions: {
        include: {
          uploader: { select: { minecraftUsername: true, id: true } },
        },
      },
    },
  });

  return fights.map((fight) => {
    const { displayId } = buildFightDisplayFields(fight);
    const playerAName =
      fight.playerA?.minecraftUsername ?? fight.createdBy.minecraftUsername ?? "?";
    const playerBName = fight.playerB?.minecraftUsername ?? fight.opponentMcName ?? "TBD";
    const disputedAt = fight.updatedAt;

    return {
      id: fight.id,
      displayId,
      playerA: playerAName,
      playerB: playerBName,
      playerAId: fight.playerAId,
      playerBId: fight.playerBId,
      wagerAmount: fight.wagerAmount,
      totalPot: fight.wagerAmount * 2,
      ruleset: fight.ruleset,
      arenaName: fight.arena.name,
      status: mapFightStatus(fight.status),
      disputedAt: disputedAt.toISOString(),
      evidence: fight.evidenceSubmissions.map((e) => ({
        id: e.id,
        uploaderId: e.uploaderId,
        uploaderName: e.uploader.minecraftUsername ?? "Unknown",
        proofUrl: e.proofUrl,
        status: e.status,
        notes: e.notes,
        createdAt: e.createdAt.toISOString(),
      })),
    };
  });
}
