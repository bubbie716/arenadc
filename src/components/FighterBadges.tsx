import type { FighterBadgeId } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

const BADGE_CONFIG: Record<FighterBadgeId, { emoji: string; label: string }> = {
  top_50: { emoji: "🏆", label: "Top 50 Fighter" },
  upset_king: { emoji: "💀", label: "Upset King" },
  win_streak: { emoji: "🔥", label: "Win Streak" },
  veteran: { emoji: "⚔", label: "Veteran Fighter" },
};

interface FighterBadgesProps {
  badges: FighterBadgeId[];
}

export function FighterBadges({ badges }: FighterBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((id) => {
        const { emoji, label } = BADGE_CONFIG[id];
        return (
          <Badge key={id} variant="hype">
            {emoji} {label}
          </Badge>
        );
      })}
    </div>
  );
}
