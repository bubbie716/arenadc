import { ensureDefaultArenas } from "@/server/arenas";
import { prisma } from "@/lib/prisma";
import { getScopedServerId } from "@/server/scope";

export async function getApprovedArenas() {
  const serverId = await getScopedServerId();
  await ensureDefaultArenas(serverId);
  return prisma.arena.findMany({
    where: { serverId, approved: true },
    orderBy: { name: "asc" },
  });
}
