import { PrismaClient } from "@prisma/client";
import { getServerConfig, SERVER_IDS } from "../src/lib/server-config";

const prisma = new PrismaClient();

const ARENAS = [
  { slug: "spawn-pvp-ring", name: "Spawn PvP Ring", description: "Central spawn duel ring" },
  { slug: "nether-colosseum", name: "Nether Colosseum", description: "Nether wart arena with lava border" },
  { slug: "desert-outpost", name: "Desert Outpost", description: "Flat sandstone platform" },
  { slug: "ice-spike-bowl", name: "Ice Spike Bowl", description: "Packed ice circular bowl" },
  { slug: "end-platform", name: "End Platform", description: "Void-edge end stone platform" },
];

async function main() {
  for (const serverId of SERVER_IDS) {
    for (const arena of ARENAS) {
      await prisma.arena.upsert({
        where: { serverId_slug: { serverId, slug: arena.slug } },
        create: { serverId, ...arena, approved: true },
        update: { name: arena.name, description: arena.description, approved: true },
      });
    }
  }

  await prisma.platformSetting.updateMany({
    where: {
      serverId: "sw",
      key: "deposit_account_name",
      value: "ArenaSW",
    },
    data: { value: getServerConfig("sw").depositAccountName },
  });

  const adminDiscordId = process.env.ADMIN_DISCORD_ID;
  if (adminDiscordId) {
    await prisma.user.updateMany({
      where: { discordId: adminDiscordId },
      data: { isAdmin: true },
    });
  }

  console.log(`Seed complete: arenas ready for ${SERVER_IDS.join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
