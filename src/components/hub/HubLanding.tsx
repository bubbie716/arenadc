"use client";

import { useEffect, useState } from "react";
import type { HubServerCard as HubServerCardData } from "@/lib/host-mode";
import { readLastHubServer, writeLastHubServer } from "@/lib/hub-storage";
import { HubServerCard } from "@/components/hub/HubServerCard";
import { HubShell } from "@/components/hub/HubShell";
import { ArenaMCLogo } from "@/components/ArenaMCLogo";
import { cn } from "@/lib/utils";

interface HubLandingProps {
  servers: HubServerCardData[];
}

export function HubLanding({ servers }: HubLandingProps) {
  const [continueTarget, setContinueTarget] = useState<HubServerCardData | null>(null);

  useEffect(() => {
    const lastId = readLastHubServer();
    if (!lastId) return;
    const match = servers.find((s) => s.id === lastId);
    if (match) setContinueTarget(match);
  }, [servers]);

  return (
    <HubShell>
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-pattern opacity-30" />
        <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-blue/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
          <section className="mx-auto max-w-3xl text-center">
            <div className="mb-8 flex justify-center">
              <ArenaMCLogo size="lg" priority />
            </div>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              ArenaMC
            </h1>
            <p className="mt-4 text-lg font-medium text-foreground/90 sm:text-xl">
              Competitive PvP Infrastructure for Minecraft Servers
            </p>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Schedule fights, settle rivalries, track records, and prove who&apos;s better.
            </p>
          </section>

          {continueTarget && (
            <div className="mx-auto mt-12 max-w-md animate-slide-up">
              <a
                href={continueTarget.href}
                onClick={() => writeLastHubServer(continueTarget.id)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl border border-accent/40",
                  "bg-accent/10 px-5 py-3.5 text-sm font-semibold text-foreground",
                  "transition-all hover:border-accent/60 hover:bg-accent/15 hover:shadow-[0_0_32px_-8px_rgba(124,92,255,0.5)]",
                )}
              >
                Continue to {continueTarget.arenaLabel}
                <span aria-hidden className="text-accent">
                  →
                </span>
              </a>
            </div>
          )}

          <section className="mt-14 sm:mt-16">
            <p className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.25em] text-muted">
              Select your server
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {servers.map((server, index) => (
                <HubServerCard
                  key={server.id}
                  server={server}
                  className={cn(
                    "animate-slide-up",
                    index === 1 && "sm:mt-4 lg:mt-6",
                  )}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </HubShell>
  );
}
