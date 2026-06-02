import type { CommunityPick, FighterStats } from "@/lib/types";
import { getFighterStatsByUsername } from "@/server/queries/fighter-stats";

export async function getFighterStats(username: string): Promise<FighterStats> {
  const stats = await getFighterStatsByUsername(username);
  const { totalWagered: _wagered, ...fighterStats } = stats;
  return fighterStats;
}

export function getCommunityPick(fightId: string): CommunityPick {
  const seed = fightId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const playerAPercent = 35 + (seed % 30);
  return {
    fightId,
    playerAPercent,
    playerBPercent: 100 - playerAPercent,
  };
}
