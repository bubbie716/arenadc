export const dynamic = "force-dynamic";

import { FightFeedSection } from "@/components/FightFeedSection";
import { HomeSidePanel } from "@/components/home/HomeSidePanel";
import { PageShell } from "@/components/PageShell";
import { DiscordLink } from "@/components/DiscordLink";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import {
  getBiggestPotFights,
  getFightCount,
  getFightsStartingSoon,
  getRecentResults,
} from "@/server/queries/fights";
import { getHomePageData } from "@/server/queries/home";
import { getResolvedPlatformSettings } from "@/server/platform-settings";
import { getSessionUser } from "@/lib/auth/session";
import { formatRmd } from "@/lib/utils";

export default async function HomePage() {
  const [startingSoon, biggestPots, recentResults, homeData, fightCount, user, platformSettings] =
    await Promise.all([
    getFightsStartingSoon(),
    getBiggestPotFights(),
    getRecentResults(),
    getHomePageData(),
    getFightCount(),
    getSessionUser(),
    getResolvedPlatformSettings(),
  ]);

  const showGetStarted = !user?.onboardingComplete;

  const { platformStats, trendingFighter, rivalry, rankedFighters, rivalries } = homeData;
  const noFights = fightCount === 0;
  const emptyMessage = "No fights scheduled yet. Be the first to create one.";

  return (
    <PageShell maxWidth="3xl" discordInviteUrl={platformSettings.discordInviteUrl}>
      <section className="relative mb-10 overflow-hidden rounded-3xl border border-border bg-surface card-interactive">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/20 blur-3xl animate-pulse-soft" />
        <div className="absolute -bottom-16 right-1/4 h-48 w-48 rounded-full bg-blue/15 blur-3xl" />

        <div className="relative grid gap-8 px-6 py-12 sm:px-10 sm:py-14 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <Badge variant="success" className="animate-pulse-soft">
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-success" />
                Live on DemocracyCraft
              </Badge>
              <span className="text-xs text-muted">
                {platformStats.fightsThisWeek} fights this week ·{" "}
                {formatRmd(platformStats.rmdWageredToday, true)} wagered today
              </span>
            </div>
            <h1 className="max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">
              Challenge rivals.{" "}
              <span className="text-gradient-accent">Escrow RMD. Prove it.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              ArenaMC is the PvP challenge platform for DemocracyCraft. Schedule fights,
              lock equal wagers in escrow, and build your public fight record.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button href="/schedule" size="lg">
                Schedule Fight
              </Button>
              {showGetStarted && (
                <Button href="/onboarding" variant="secondary" size="lg">
                  Get Started
                </Button>
              )}
              <DiscordLink href={platformSettings.discordInviteUrl} variant="button">
                Join Discord
              </DiscordLink>
            </div>
          </div>
          <div className="hidden min-w-[200px] rounded-2xl border border-border/60 bg-surface-elevated/80 px-6 py-5 text-center lg:block">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
              Platform pulse
            </p>
            <p className="mt-2 text-3xl font-black tabular-nums text-accent">
              {platformStats.activeFighters}
            </p>
            <p className="text-xs text-muted">active fighters</p>
            <p className="mt-4 text-sm font-bold text-foreground">
              {formatRmd(platformStats.largestPotToday, true)}
            </p>
            <p className="text-[10px] text-muted">largest pot today</p>
          </div>
        </div>
      </section>

      <div className="mb-10 grid gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="space-y-10 lg:col-span-8">
          {noFights ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-8 py-16 text-center">
              <p className="text-lg font-medium text-foreground">{emptyMessage}</p>
              <div className="mt-6">
                <Button href="/schedule" size="lg">
                  Schedule Fight
                </Button>
              </div>
            </div>
          ) : (
            <>
              <FightFeedSection
                title="Starting Soon"
                subtitle="Upcoming and live fights — clocks count down in real time"
                fights={startingSoon}
                rankedFighters={rankedFighters}
                rivalries={rivalries}
                emptyMessage={emptyMessage}
              />
              <FightFeedSection
                title="Biggest Pots"
                subtitle="Highest stakes on the board right now"
                fights={biggestPots}
                rankedFighters={rankedFighters}
                rivalries={rivalries}
              />
              <FightFeedSection
                title="Recent Results"
                subtitle="Confirmed winners and payouts"
                fights={recentResults}
                rankedFighters={rankedFighters}
                rivalries={rivalries}
              />
            </>
          )}
        </div>
        <div className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
          <HomeSidePanel
            trendingFighter={trendingFighter}
            rivalry={rivalry}
            platformStats={platformStats}
          />
        </div>
      </div>
    </PageShell>
  );
}
