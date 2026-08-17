import { cn } from "@/lib/utils";

interface StreakDisplayProps {
  streak: number;
  size?: "sm" | "md";
}

export function StreakDisplay({ streak, size = "md" }: StreakDisplayProps) {
  const label =
    streak > 0 ? `W${streak}` : streak < 0 ? `L${Math.abs(streak)}` : "—";
  const isWin = streak > 0;
  const isLoss = streak < 0;

  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center rounded-lg border px-2.5 py-1 font-bold tabular-nums",
        size === "sm" ? "text-xs" : "text-sm",
        isWin && "border-success/40 bg-success/10 text-success",
        isLoss && "border-danger/40 bg-danger/10 text-danger",
        !isWin && !isLoss && "border-border text-muted",
      )}
    >
      {isWin && "🔥 "}
      {label}
    </span>
  );
}
