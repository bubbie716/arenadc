import { ensureDefaultArenas } from "@/server/arenas";
import { prisma } from "@/lib/prisma";

export async function getApprovedArenas() {
  await ensureDefaultArenas();
  return prisma.arena.findMany({
    where: { approved: true },
    orderBy: { name: "asc" },
  });
}
