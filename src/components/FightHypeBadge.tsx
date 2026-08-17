import { getHypeLabel } from "@/lib/fight-hype";
import type { FightHypeTag } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface FightHypeBadgeProps {
  tag: FightHypeTag;
}

export function FightHypeBadge({ tag }: FightHypeBadgeProps) {
  const { emoji, label } = getHypeLabel(tag);
  const variant =
    tag === "disputed" ? "danger" : tag === "high_stakes" ? "hype" : "default";

  return (
    <Badge variant={variant}>
      <span>{emoji}</span>
      {label}
    </Badge>
  );
}
