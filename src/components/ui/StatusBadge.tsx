import { cn, getStatusLabel } from "@/lib/utils";
import type { FightStatus } from "@/lib/types";

const statusStyles: Record<FightStatus, string> = {
  draft: "bg-muted/15 text-muted border-border",
  pending_acceptance: "bg-blue/15 text-blue border-blue/30",
  open: "bg-blue/15 text-blue border-blue/30",
  confirmed: "bg-accent/15 text-accent-hover border-accent/30",
  scheduled: "bg-accent/15 text-accent-hover border-accent/30",
  in_progress: "bg-warning/15 text-warning border-warning/30",
  awaiting_result: "bg-warning/15 text-warning border-warning/30",
  awaiting_recordings: "bg-danger/15 text-danger border-danger/30",
  completed: "bg-success/15 text-success border-success/30",
  disputed: "bg-danger/15 text-danger border-danger/30",
  cancelled: "bg-muted/15 text-muted border-border",
  declined: "bg-muted/15 text-muted border-border",
  refunded: "bg-muted/15 text-muted border-border",
};

interface StatusBadgeProps {
  status: FightStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
        statusStyles[status],
        className,
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
}
