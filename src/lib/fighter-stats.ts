import type { FighterStats } from "@/lib/types";
import { getFighterStatsByUsername } from "@/server/queries/fighter-stats";

export async function getFighterStats(username: string): Promise<FighterStats> {
  const stats = await getFighterStatsByUsername(username);
  const { totalWagered: _wagered, ...fighterStats } = stats;
  return fighterStats;
}
