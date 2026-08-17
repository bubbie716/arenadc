interface HubPlatformPulseProps {
  signedUpUsers: number;
  largestPotLabel: string;
  className?: string;
}

/** Compact pulse widget — matches arena home hero styling. */
export function HubPlatformPulse({
  signedUpUsers,
  largestPotLabel,
  className,
}: HubPlatformPulseProps) {
  return (
    <div
      className={`min-w-[7.5rem] shrink-0 rounded-2xl border border-border/60 bg-surface-elevated/80 px-4 py-4 text-center sm:min-w-[8.5rem] sm:px-5 ${className ?? ""}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Platform pulse</p>
      <p className="mt-2 text-3xl font-black tabular-nums text-accent">
        {signedUpUsers.toLocaleString()}
      </p>
      <p className="text-xs text-muted">active fighters</p>
      <p className="mt-4 text-sm font-bold text-foreground">{largestPotLabel}</p>
      <p className="text-[10px] text-muted">largest pot today</p>
    </div>
  );
}
