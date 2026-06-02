import { prisma } from "@/lib/prisma";

export async function getApprovedArenas() {
  return prisma.arena.findMany({
    where: { approved: true },
    orderBy: { name: "asc" },
  });
}
