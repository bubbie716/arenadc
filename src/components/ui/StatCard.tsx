import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  className?: string;
  highlight?: boolean;
}

export function StatCard({ label, value, subtext, className, highlight }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex min-h-[6.25rem] flex-col justify-center rounded-xl border border-border bg-surface-elevated p-5 transition-all duration-200",
        "hover:border-accent/25 hover:shadow-md hover:shadow-black/20",
        highlight && "border-accent/40 glow-accent",
        className,
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1.5 text-2xl font-bold tabular-nums text-foreground">{value}</p>
      {subtext && <p className="mt-1 text-xs text-muted">{subtext}</p>}
    </div>
  );
}
