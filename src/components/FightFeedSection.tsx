import type { Fight, Rivalry } from "@/lib/types";
import { FightCard } from "./FightCard";

interface FightFeedSectionProps {
  title: string;
  subtitle?: string;
  fights: Fight[];
  rankedFighters?: string[];
  rivalries?: Rivalry[];
  emptyMessage?: string;
}

export function FightFeedSection({
  title,
  subtitle,
  fights,
  rankedFighters,
  rivalries,
  emptyMessage,
}: FightFeedSectionProps) {
  if (fights.length === 0) {
    if (!emptyMessage) return null;
    return (
      <section className="mb-10">
        <div className="mb-5 border-l-4 border-accent pl-4">
          <h2 className="text-[1.625rem] font-black leading-tight tracking-tight">{title}</h2>
          {subtitle && <p className="mt-1.5 text-sm leading-relaxed text-muted">{subtitle}</p>}
        </div>
        <p className="rounded-xl border border-dashed border-border bg-surface/50 px-6 py-10 text-center text-muted">
          {emptyMessage}
        </p>
      </section>
    );
  }

  return (
    <section className="mb-10">
      <div className="mb-5 border-l-4 border-accent pl-4">
        <h2 className="text-[1.625rem] font-black leading-tight tracking-tight">{title}</h2>
        {subtitle && <p className="mt-1.5 text-sm leading-relaxed text-muted">{subtitle}</p>}
      </div>
      <div className="grid gap-4">
        {fights.map((fight) => (
          <FightCard
            key={fight.id}
            fight={fight}
            rankedFighters={rankedFighters}
            rivalries={rivalries}
          />
        ))}
      </div>
    </section>
  );
}
