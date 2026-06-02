import { PLATFORM_FEE_PERCENT } from "@/lib/constants";
import { calculatePot, formatRmd } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PotShowcaseProps {
  wagerAmount: number;
  className?: string;
}

export function PotShowcase({ wagerAmount, className }: PotShowcaseProps) {
  const { totalPot, platformFee, winnerPayout } = calculatePot(wagerAmount);

  return (
    <section
      className={cn(
        "mb-10 grid gap-4 lg:grid-cols-[1.35fr_1fr] lg:items-stretch",
        className,
      )}
    >
      <div className="flex flex-col justify-center rounded-3xl border border-accent/40 bg-gradient-to-br from-accent/15 via-surface to-blue/10 p-7 text-center glow-pot card-interactive sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-accent">
          🔥 Total Pot
        </p>
        <p className="mt-2 text-5xl font-black tabular-nums tracking-tight sm:text-6xl">
          {formatRmd(totalPot)}
        </p>
        <p className="mt-2.5 text-sm text-muted">
          {formatRmd(wagerAmount)} per fighter · locked in escrow
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <div className="flex min-h-[7.5rem] flex-col justify-center rounded-2xl border border-success/30 bg-success/5 p-5 transition-all duration-200 hover:border-success/50 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-success">
            Winner Receives
          </p>
          <p className="mt-2 text-3xl font-black text-success tabular-nums">
            {formatRmd(winnerPayout)}
          </p>
        </div>
        <div className="flex min-h-[7.5rem] flex-col justify-center rounded-2xl border border-border bg-surface-elevated p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            Platform Fee ({PLATFORM_FEE_PERCENT}%)
          </p>
          <p className="mt-2 text-2xl font-bold text-muted tabular-nums">
            {formatRmd(platformFee)}
          </p>
        </div>
      </div>
    </section>
  );
}
