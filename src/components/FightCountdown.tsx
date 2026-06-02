"use client";

import { useEffect, useState } from "react";
import type { FightStatus } from "@/lib/types";
import { cn, formatDate, getFightStatusDisplay, getStartsInCountdownText } from "@/lib/utils";

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
  const isLiveCountdown = status === "confirmed" || status === "scheduled";
  const [livePrimary, setLivePrimary] = useState(() =>
    isLiveCountdown ? getStartsInCountdownText(scheduledAt) : "",
  );

  useEffect(() => {
    if (!isLiveCountdown) return;
    setLivePrimary(getStartsInCountdownText(scheduledAt));
    const id = setInterval(() => setLivePrimary(getStartsInCountdownText(scheduledAt)), 1000);
    return () => clearInterval(id);
  }, [scheduledAt, isLiveCountdown]);

  const { primary, subtext } = getFightStatusDisplay({
    status,
    scheduledAt,
    completedAt,
  });

  const displayPrimary = isLiveCountdown ? livePrimary : primary;

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
          "tabular-nums",
          isUpcoming ? "text-foreground" : "text-muted",
          (status === "disputed" || status === "awaiting_recordings") && "text-danger",
          status === "awaiting_result" && "text-warning",
        )}
      >
        {displayPrimary}
      </p>
      <p className={cn(sizeClass.sub, "text-muted")}>
        {isLiveCountdown ? `Scheduled ${formatDate(scheduledAt)}` : subtext}
      </p>
    </div>
  );
}
