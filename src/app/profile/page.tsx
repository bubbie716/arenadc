export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { FightCard } from "@/components/FightCard";
import { FighterBadges } from "@/components/FighterBadges";
import { PageShell } from "@/components/PageShell";
import { MinecraftHead } from "@/components/MinecraftHead";
import { StreakDisplay } from "@/components/StreakDisplay";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { FightStatus } from "@prisma/client";
import { getSessionUser } from "@/lib/auth/session";
import { resolveDiscordInviteUrl } from "@/components/MaintenanceGuard";
import { prisma } from "@/lib/prisma";
import { getActiveServerConfig } from "@/lib/server-context";
import { formatCurrency } from "@/lib/utils";
import { getFighterStatsByUsername } from "@/server/queries/fighter-stats";
import { getUserRecentFights } from "@/server/queries/fights";
import { getRankedFighterNames } from "@/server/queries/users";
import { getWalletData } from "@/server/queries/wallet";
import type { FighterBadgeId } from "@/lib/types";

export default async function ProfilePage() {
  const config = await getActiveServerConfig();
  const user = await getSessionUser();
  if (!user) redirect("/onboarding");
  if (!user.onboardingComplete || !user.minecraftUsername) redirect("/onboarding");

  const [recentFights, wallet, fighterStats, activeFights, rankedNames, discordInviteUrl] =
    await Promise.all([
    getUserRecentFights(user.minecraftUsername),
    getWalletData(user.id),
    getFighterStatsByUsername(user.minecraftUsername),
    prisma.fight.count({
      where: {
        OR: [{ playerAId: user.id }, { playerBId: user.id }],
        status: {
          in: [
            FightStatus.PENDING_ACCEPTANCE,
            FightStatus.OPEN,
            FightStatus.CONFIRMED,
            FightStatus.SCHEDULED,
            FightStatus.IN_PROGRESS,
            FightStatus.AWAITING_RESULT,
            FightStatus.AWAITING_RECORDINGS,
            FightStatus.DISPUTED,
          ],
        },
      },
    }),
    getRankedFighterNames(),
    resolveDiscordInviteUrl(),
  ]);

  const rankIndex = rankedNames.indexOf(user.minecraftUsername);
  const rankLabel = rankIndex >= 0 ? `#${rankIndex + 1}` : "—";
  const joinedLabel = user.createdAt.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  const badges: FighterBadgeId[] = [];
  if (wallet.lifetimeEarnings > 5000) badges.push("veteran");
  if (user.walletBalance > 10000) badges.push("top_50");

  return (
    <PageShell
      title="Profile"
      description="Your public fight record and stats on ArenaMC."
      maxWidth="xl"
      discordInviteUrl={discordInviteUrl}
    >
      <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-surface card-interactive">
        <div className="bg-gradient-to-r from-accent/10 via-transparent to-blue/10 px-6 py-7 sm:flex sm:items-center sm:gap-8">
          <MinecraftHead
            username={user.minecraftUsername}
            size={96}
            className="shrink-0 ring-4 ring-accent/20"
          />
          <div className="mt-5 min-w-0 flex-1 sm:mt-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-black tracking-tight">{user.minecraftUsername}</h2>
              <span className="rounded-full border border-border px-3 py-1 text-sm text-muted">
                {user.discordUsername}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted">
              <span>
                <span className="font-semibold text-foreground">Joined</span> {joinedLabel}
              </span>
              <span>
                <span className="font-semibold text-foreground">Rank</span> {rankLabel}
              </span>
              <span>
                <span className="font-semibold text-foreground">Active fights</span>{" "}
                {activeFights}
              </span>
            </div>
            {badges.length > 0 && (
              <div className="mt-4">
                <FighterBadges badges={badges} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Record"
          value={`${fighterStats.record.wins}W – ${fighterStats.record.losses}L`}
        />
        <StatCard label="Win Rate" value={`${fighterStats.winRate}%`} highlight />
        <StatCard label="Total Wagered" value={formatCurrency(fighterStats.totalWagered, config)} />
        <StatCard
          label="Lifetime Earnings"
          value={formatCurrency(wallet.lifetimeEarnings, config)}
        />
        <Card className="flex min-h-[6.25rem]">
          <CardContent className="flex w-full flex-col justify-center p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Streak</p>
            <div className="mt-3">
              <StreakDisplay streak={fighterStats.currentStreak} size="md" />
            </div>
          </CardContent>
        </Card>
      </div>

      <section>
        <h2 className="mb-5 text-[1.375rem] font-bold tracking-tight">Recent Fight History</h2>
        {recentFights.length === 0 ? (
          <p className="text-muted">No fights yet. Schedule your first challenge.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {recentFights.map((fight) => (
              <FightCard key={fight.id} fight={fight} compact />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
