import { prisma } from "@/lib/prisma";
import { formatFightDisplayId } from "@/lib/fight-display";
import { getScopedServerId } from "@/server/scope";

/** Assign a fightNumber when missing (legacy rows or stale clients). */
export async function ensureFightDisplayNumber(fightId: string): Promise<number> {
  const serverId = await getScopedServerId();
  const existing = await prisma.fight.findFirst({
    where: { id: fightId, serverId },
    select: { fightNumber: true },
  });

  if (existing?.fightNumber != null && existing.fightNumber > 0) {
    return existing.fightNumber;
  }

  const { _max } = await prisma.fight.aggregate({
    where: { serverId },
    _max: { fightNumber: true },
  });
  const next = (_max.fightNumber ?? 0) + 1;

  const updated = await prisma.fight.update({
    where: { id: fightId },
    data: { fightNumber: next },
    select: { fightNumber: true },
  });

  return updated.fightNumber;
}

export async function repairAllFightDisplayNumbers(): Promise<void> {
  const serverId = await getScopedServerId();
  const invalid = await prisma.fight.findMany({
    where: { serverId, fightNumber: { lte: 0 } },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (invalid.length === 0) return;

  const { _max } = await prisma.fight.aggregate({
    where: { serverId },
    _max: { fightNumber: true },
  });
  let next = (_max.fightNumber ?? 0) + 1;

  for (const fight of invalid) {
    await prisma.fight.update({
      where: { id: fight.id },
      data: { fightNumber: next },
    });
    next += 1;
  }
}

export async function attachDisplayToFight<T extends { id: string; fightNumber?: number | null }>(
  fight: T,
): Promise<T & { fightNumber: number; displayId: string }> {
  let fightNumber = fight.fightNumber;
  if (fightNumber == null || fightNumber < 1) {
    fightNumber = await ensureFightDisplayNumber(fight.id);
  }
  return {
    ...fight,
    fightNumber,
    displayId: formatFightDisplayId(fightNumber),
  };
}
