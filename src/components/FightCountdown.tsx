import type { FightStatus } from "@/lib/types";
import { cn, getFightStatusDisplay } from "@/lib/utils";

interface FightCountdownProps {
  scheduledAt: string;
  status: FightStatus;
  completedAt?: string;
  size?: "sm" | "md" | "lg";
  align?: "left" | "right";
  className?: string;
}

export function FightCountdown({
  scheduledAt,
  status,
  completedAt,
  size = "md",
  align = "right",
  className,
}: FightCountdownProps) {
  const { primary, subtext } = getFightStatusDisplay({
    status,
    scheduledAt,
    completedAt,
  });

  const sizeClass = {
    sm: { primary: "text-xs font-semibold", sub: "text-[10px]" },
    md: { primary: "text-sm font-bold", sub: "text-xs" },
    lg: { primary: "text-base font-bold", sub: "text-xs" },
  }[size];

  const isUpcoming =
    status === "scheduled" ||
    status === "open" ||
    status === "confirmed" ||
    status === "pending_acceptance";

  return (
    <div className={cn(align === "left" ? "text-left" : "text-right", className)}>
      <p
        className={cn(
          sizeClass.primary,
          isUpcoming ? "text-foreground" : "text-muted",
          (status === "disputed" || status === "awaiting_recordings") && "text-danger",
          status === "awaiting_result" && "text-warning",
        )}
      >
        {primary}
      </p>
      <p className={cn(sizeClass.sub, "text-muted")}>{subtext}</p>
    </div>
  );
}
