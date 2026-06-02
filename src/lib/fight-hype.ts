import type { Fight, FightHypeTag, Rivalry } from "@/lib/types";
import { isHighStakesFight } from "@/lib/utils";

const HYPE_LABELS: Record<FightHypeTag, { emoji: string; label: string }> = {
  high_stakes: { emoji: "🔥", label: "High Stakes" },
  rivalry: { emoji: "⚔", label: "Rivalry Match" },
  ranked: { emoji: "👑", label: "Ranked Fighter" },
  disputed: { emoji: "💀", label: "Disputed Fight" },
};

export function getHypeLabel(tag: FightHypeTag) {
  return HYPE_LABELS[tag];
}

export function getFightHypeTags(
  fight: Fight,
  options?: { rankedFighters?: string[]; rivalries?: Rivalry[] },
): FightHypeTag[] {
  const tags: FightHypeTag[] = [];
  const ranked = options?.rankedFighters ?? [];
  const rivalries = options?.rivalries ?? [];

  if (isHighStakesFight(fight.wagerAmount)) {
    tags.push("high_stakes");
  }

  if (fight.status === "disputed") {
    tags.push("disputed");
  }

  const isRivalry = rivalries.some(
    (r) =>
      (r.playerA === fight.playerA && r.playerB === fight.playerB) ||
      (r.playerA === fight.playerB && r.playerB === fight.playerA),
  );
  if (isRivalry) tags.push("rivalry");

  if (ranked.includes(fight.playerA) || ranked.includes(fight.playerB)) {
    tags.push("ranked");
  }

  return tags;
}
