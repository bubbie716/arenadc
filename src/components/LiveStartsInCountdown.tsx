"use client";

import { useEffect, useState } from "react";
import { cn, getStartsInCountdownText } from "@/lib/utils";

interface LiveStartsInCountdownProps {
  scheduledAt: string;
  className?: string;
}

export function LiveStartsInCountdown({ scheduledAt, className }: LiveStartsInCountdownProps) {
  const [text, setText] = useState(() => getStartsInCountdownText(scheduledAt));

  useEffect(() => {
    setText(getStartsInCountdownText(scheduledAt));
    const id = setInterval(() => setText(getStartsInCountdownText(scheduledAt)), 1000);
    return () => clearInterval(id);
  }, [scheduledAt]);

  return <span className={cn("tabular-nums", className)}>{text}</span>;
}
