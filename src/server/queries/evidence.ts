import { mapEvidenceSubmission } from "@/lib/mappers";
import { prisma } from "@/lib/prisma";
import type { EvidenceSubmission } from "@/lib/types";
import { getScopedServerId } from "@/server/scope";

export async function getFightEvidenceSubmissions(
  fightId: string,
): Promise<EvidenceSubmission[]> {
  const serverId = await getScopedServerId();
  const rows = await prisma.evidenceSubmission.findMany({
    where: { serverId, fightId },
    include: { uploader: { select: { minecraftUsername: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapEvidenceSubmission);
}

export async function getLatestEvidenceByFighter(
  fightId: string,
): Promise<{ playerA: EvidenceSubmission | null; playerB: EvidenceSubmission | null }> {
  const serverId = await getScopedServerId();
  const fight = await prisma.fight.findFirst({
    where: { id: fightId, serverId },
    select: { playerAId: true, playerBId: true },
  });
  if (!fight?.playerAId || !fight?.playerBId) {
    return { playerA: null, playerB: null };
  }

  const submissions = await prisma.evidenceSubmission.findMany({
    where: { serverId, fightId },
    include: { uploader: { select: { minecraftUsername: true } } },
  });

  const playerA =
    submissions.find((s) => s.uploaderId === fight.playerAId) ?? null;
  const playerB =
    submissions.find((s) => s.uploaderId === fight.playerBId) ?? null;

  return {
    playerA: playerA ? mapEvidenceSubmission(playerA) : null,
    playerB: playerB ? mapEvidenceSubmission(playerB) : null,
  };
}
