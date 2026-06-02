import type { Fight } from "@/lib/types";
import { getFightLocationLabel } from "@/lib/fight-location";
import {
  formatEndedAgo,
  formatStartsIn,
  getFormatLabel,
  getRulesetLabel,
} from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FightTimelineProps {
  fight: Fight;
}

export function FightTimeline({ fight }: FightTimelineProps) {
  let headline = "";
  let detail = "";

  switch (fight.status) {
    case "pending_acceptance":
      headline = "Awaiting opponent";
      detail = "Invite must be accepted before escrow locks";
      break;
    case "draft":
      headline = "Draft";
      detail = "Fight not published";
      break;
    case "confirmed":
    case "scheduled":
    case "open":
      headline =
        fight.status === "open" ? "Open Challenge" : formatStartsIn(fight.scheduledAt);
      detail = `Fight location: ${getFightLocationLabel(fight.fightLocation, fight.arenaName)}`;
      break;
    case "in_progress":
      headline = "Fight in progress";
      detail = "Awaiting fighter confirmation";
      break;
    case "awaiting_result":
      headline = "Awaiting result";
      detail = "Waiting for fighters to confirm";
      break;
    case "awaiting_recordings":
      headline = "Submit POV proof links";
      detail = "Both fighters must submit dispute evidence links";
      break;
    case "disputed":
      headline = "Disputed";
      detail = "Admin review in progress";
      break;
    case "refunded":
      headline = "Refunded";
      detail = "Wagers returned to fighters";
      break;
    case "completed":
      headline = fight.winner ? `Winner: ${fight.winner}` : "Fight completed";
      detail = formatEndedAgo(fight.completedAt ?? fight.scheduledAt);
      break;
    case "cancelled":
      headline = "Fight cancelled";
      detail = "Wagers refunded to fighters";
      break;
    case "declined":
      headline = "Challenge declined";
      detail = "No wagers were locked";
      break;
    default:
      headline = fight.status;
      detail = getFormatLabel(fight.format);
  }

  if (fight.status === "in_progress" && fight.round) {
    const formatLabel = getFormatLabel(fight.format);
    const maxRounds =
      fight.format === "bo1"
        ? 1
        : fight.format === "first_to_10"
          ? 10
          : parseInt(fight.format.replace("bo", ""), 10) || 3;
    headline = `Round ${fight.round} of ${maxRounds}`;
    detail = `${formatLabel} · ${getRulesetLabel(fight.ruleset)}`;
  }

  return (
    <Card className="mb-8 border-accent/20">
      <CardHeader className="pb-2">
        <p className="text-xs font-bold uppercase tracking-widest text-muted">Status</p>
        <CardTitle className="text-2xl">{headline}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted">{detail}</p>
      </CardContent>
    </Card>
  );
}
