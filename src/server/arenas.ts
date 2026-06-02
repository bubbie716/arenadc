import { prisma } from "@/lib/prisma";

export const DEFAULT_ARENAS = [
  { slug: "spawn-pvp-ring", name: "Spawn PvP Ring", description: "Central spawn duel ring" },
  {
    slug: "nether-colosseum",
    name: "Nether Colosseum",
    description: "Nether wart arena with lava border",
  },
  { slug: "desert-outpost", name: "Desert Outpost", description: "Flat sandstone platform" },
  {
    slug: "ice-spike-bowl",
    name: "Ice Spike Bowl",
    description: "Packed ice circular bowl",
  },
  { slug: "end-platform", name: "End Platform", description: "Void-edge end stone platform" },
] as const;

/** Ensure baseline arenas exist (migration creates the table but does not seed rows). */
export async function ensureDefaultArenas() {
  for (const arena of DEFAULT_ARENAS) {
    await prisma.arena.upsert({
      where: { slug: arena.slug },
      create: { ...arena, approved: true },
      update: { name: arena.name, description: arena.description, approved: true },
    });
  }
}

export async function getDefaultArena() {
  await ensureDefaultArenas();
  return prisma.arena.findFirst({
    where: { approved: true },
    orderBy: { slug: "asc" },
  });
}
