"use client";

import type { HubServerCard as HubServerCardData } from "@/lib/host-mode";
import { writeLastHubServer } from "@/lib/hub-storage";
import { cn } from "@/lib/utils";

interface HubServerCardProps {
  server: HubServerCardData;
  className?: string;
}

export function HubServerCard({ server, className }: HubServerCardProps) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface",
        "card-interactive hover:border-accent/35 hover:shadow-[0_20px_50px_-20px_rgba(124,92,255,0.35)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-blue/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
              {server.name}
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">{server.arenaLabel}</h2>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-2xl font-black tabular-nums leading-none text-foreground">
              {server.activeUsers.toLocaleString()}
            </p>
            <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Active users
            </p>
          </div>
        </div>
        <ul className="mt-5 space-y-2.5">
          {server.features.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-2.5 text-sm text-muted transition-colors group-hover:text-foreground/90"
            >
              <span
                className="h-1 w-1 shrink-0 rounded-full bg-accent/80"
                aria-hidden
              />
              {feature}
            </li>
          ))}
        </ul>
        <a
          href={server.href}
          onClick={() => writeLastHubServer(server.id)}
          className={cn(
            "mt-8 inline-flex w-full items-center justify-center rounded-xl px-4 py-3",
            "text-sm font-semibold transition-all duration-200",
            "bg-accent text-white hover:bg-accent-hover",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
          )}
        >
          Enter Arena
        </a>
      </div>
    </article>
  );
}
