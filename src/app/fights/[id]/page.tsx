export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { AcceptFightPanel } from "@/components/fight/AcceptFightPanel";
import { EarlyStartPanel } from "@/components/fight/EarlyStartPanel";
import { FightConfirmation, type FightResultReport } from "@/components/FightConfirmation";
import { CommunityPick } from "@/components/fight/CommunityPick";
import { FighterComparison } from "@/components/fight/FighterComparison";
import { FightTimeline } from "@/components/fight/FightTimeline";
import { MatchupHero } from "@/components/fight/MatchupHero";
import { PotShowcase } from "@/components/fight/PotShowcase";
import { SpectatorPredictionPool } from "@/components/fight/SpectatorPredictionPool";
import { DisputeEvidence } from "@/components/fight/DisputeEvidence";
import { FightRecordings } from "@/components/fight/FightRecordings";
import { RecordingNotice } from "@/components/fight/RecordingNotice";
import {
  canAgreeToStartFightEarly,
  DISPUTE_EVIDENCE_STATUSES,
  fightHasStartedForReporting,
  RESULT_CONFIRMATION_VISIBLE_STATUSES,
  RESOLVED_FIGHT_STATUSES,
} from "@/lib/fight-statuses";
import { FightStatus as DbFightStatus, FightResultType } from "@prisma/client";
import { getLatestEvidenceByFighter } from "@/server/queries/evidence";
import { getPlatformFeePercent } from "@/server/platform-settings";
import { resolveDiscordInviteUrl } from "@/components/MaintenanceGuard";
import { FighterCard } from "@/components/FighterCard";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/auth";
import { getCommunityPickForFight } from "@/server/queries/community-pick";
import { getSpectatorPoolSummary } from "@/server/queries/spectator-betting";
import { getFighterStats } from "@/lib/fighter-stats";
import { getFightLocationLabel } from "@/lib/fight-location";
import { getFormatLabel, getRulesetLabel } from "@/lib/utils";
import { fightInclude, mapFightToUI } from "@/lib/mappers";
import { prisma } from "@/lib/prisma";
interface FightDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function FightDetailPage({ params }: FightDetailPageProps) {
  const { id } = await params;
  const session = await auth();

  const [{ syncPastScheduledFights }, { repairAllFightDisplayNumbers, ensureFightDisplayNumber }, platformFeePercent, discordInviteUrl] =
    await Promise.all([
      import("@/server/fight-status"),
      import("@/server/fight-display"),
      getPlatformFeePercent(),
      resolveDiscordInviteUrl(),
    ]);
  await syncPastScheduledFights();
  await repairAllFightDisplayNumbers();

  const fightRow = await prisma.fight.findUnique({
    where: { id },
    include: {
      ...fightInclude,
      createdBy: { select: { id: true, minecraftUsername: true } },
      playerA: { select: { id: true, minecraftUsername: true } },
      playerB: { select: { id: true, minecraftUsername: true } },
      results: { select: { reportedById: true, type: true } },
    },
  });

  if (!fightRow) notFound();

  if (fightRow.fightNumber == null || fightRow.fightNumber < 1) {
    fightRow.fightNumber = await ensureFightDisplayNumber(fightRow.id);
  }

  const fight = mapFightToUI(fightRow);
  const [statsA, statsB, communityPick, spectatorPool] = await Promise.all([
    getFighterStats(fight.playerA),
    getFighterStats(fight.playerB),
    getCommunityPickForFight(fight.id, session?.user?.dbUserId),
    getSpectatorPoolSummary(fight.id, session?.user?.dbUserId),
  ]);
  const dbUserId = session?.user?.dbUserId;
  const mcName = session?.user?.minecraftUsername?.toLowerCase();

  const walletBalance =
    dbUserId != null
      ? ((await prisma.user.findUnique({
          where: { id: dbUserId },
          select: { walletBalance: true },
        }))?.walletBalance ?? 0)
      : 0;

  const isCreator = dbUserId === fightRow.createdById;
  const isPlayer = dbUserId === fightRow.playerAId || dbUserId === fightRow.playerBId;

  const resultTypeToReport = (type: FightResultType): FightResultReport | null => {
    switch (type) {
      case FightResultType.WIN:
        return "won";
      case FightResultType.LOSS:
        return "lost";
      case FightResultType.DISPUTE:
        return "dispute";
      default:
        return null;
    }
  };

  const playerResult = dbUserId
    ? fightRow.results.find((r) => r.reportedById === dbUserId)
    : undefined;
  const existingReport: FightResultReport | null = playerResult
    ? resultTypeToReport(playerResult.type)
    : null;

  const acceptableStatuses: DbFightStatus[] = ["OPEN", "PENDING_ACCEPTANCE"];
  const canAccept =
    acceptableStatuses.includes(fightRow.status) &&
    Boolean(dbUserId) &&
    !isCreator &&
    (fightRow.isOpenChallenge || fightRow.opponentMcName?.toLowerCase() === mcName);
  const canDecline =
    fightRow.status === "PENDING_ACCEPTANCE" &&
    Boolean(dbUserId) &&
    !isCreator &&
    fightRow.opponentMcName?.toLowerCase() === mcName;

  const showEarlyStartPanel =
    Boolean(dbUserId) &&
    isPlayer &&
    canAgreeToStartFightEarly(fightRow) &&
    !(fightRow.earlyStartPlayerAAt && fightRow.earlyStartPlayerBAt);

  const showResultConfirmation =
    isPlayer && RESULT_CONFIRMATION_VISIBLE_STATUSES.includes(fightRow.status);

  const canReportResults =
    showResultConfirmation && fightHasStartedForReporting(fightRow);

  const showEvidenceUpload = DISPUTE_EVIDENCE_STATUSES.includes(fightRow.status);
  const showResolvedRecordings = RESOLVED_FIGHT_STATUSES.includes(fightRow.status);
  const shouldLoadEvidence =
    (showEvidenceUpload || showResolvedRecordings) &&
    fightRow.playerAId &&
    fightRow.playerBId;
  const evidence = shouldLoadEvidence
    ? await getLatestEvidenceByFighter(fightRow.id)
    : { playerA: null, playerB: null };

  return (
    <PageShell maxWidth="xl" discordInviteUrl={discordInviteUrl}>
      <MatchupHero fight={fight} />

      {showResolvedRecordings && (
        <FightRecordings
          playerALabel={fight.playerA}
          playerBLabel={fight.playerB}
          evidenceA={evidence.playerA}
          evidenceB={evidence.playerB}
        />
      )}

      <PotShowcase wagerAmount={fight.wagerAmount} platformFeePercent={platformFeePercent} />

      {spectatorPool && fight.playerB !== "TBD" && (
        <SpectatorPredictionPool
          pool={spectatorPool}
          playerA={fight.playerA}
          playerB={fight.playerB}
          isFighter={isPlayer}
          walletBalance={walletBalance}
        />
      )}

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Kit", value: getRulesetLabel(fight.ruleset) },
          { label: "Format", value: getFormatLabel(fight.format) },
          {
            label: "Fight Location",
            value: getFightLocationLabel(fight.fightLocation, fight.arenaName),
          },
        ].map((item) => (
          <Card key={item.label} className="flex text-center transition-all hover:border-accent/30">
            <CardContent className="flex min-h-[5.5rem] w-full flex-col items-center justify-center p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">
                {item.label}
              </p>
              <p className="mt-1 font-bold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <FightTimeline fight={fight} />

      {canAccept && (
        <AcceptFightPanel
          fightId={fight.id}
          fightDisplayId={fight.displayId}
          fightNumber={fight.fightNumber}
          wagerAmount={fight.wagerAmount}
          canAccept={canAccept}
          canDecline={canDecline}
        />
      )}

      {showEarlyStartPanel &&
        fightRow.playerAId &&
        fightRow.playerBId &&
        dbUserId && (
          <EarlyStartPanel
            fightId={fight.id}
            playerA={fight.playerA}
            playerB={fight.playerB}
            playerAId={fightRow.playerAId}
            playerBId={fightRow.playerBId}
            currentUserId={dbUserId}
            earlyStartPlayerAAt={fightRow.earlyStartPlayerAAt?.toISOString() ?? null}
            earlyStartPlayerBAt={fightRow.earlyStartPlayerBAt?.toISOString() ?? null}
          />
        )}

      {fight.playerB !== "TBD" && (
        <CommunityPick pick={communityPick} playerA={fight.playerA} playerB={fight.playerB} />
      )}

      {fight.playerB !== "TBD" && (
        <FighterComparison
          playerA={fight.playerA}
          playerB={fight.playerB}
          statsA={statsA}
          statsB={statsB}
        />
      )}

      <section className="mb-10">
        <h2 className="mb-5 text-[1.375rem] font-bold tracking-tight">Fighters</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <FighterCard
            username={fight.playerA}
            stats={statsA}
            wagerAmount={fight.wagerAmount}
            isWinner={fight.status === "completed" && fight.winner === fight.playerA}
          />
          <FighterCard
            username={fight.playerB}
            stats={statsB}
            wagerAmount={fight.wagerAmount}
            isWinner={fight.status === "completed" && fight.winner === fight.playerB}
          />
        </div>
      </section>

      {showResultConfirmation && (
        <FightConfirmation
          fightId={fight.id}
          existingReport={existingReport}
          isFreeFight={fight.wagerAmount === 0}
          canReport={canReportResults}
        />
      )}

      {showEvidenceUpload && (
        <DisputeEvidence
          fightId={fight.id}
          playerALabel={fight.playerA}
          playerBLabel={fight.playerB}
          playerAId={fightRow.playerAId}
          playerBId={fightRow.playerBId}
          currentUserId={dbUserId ?? null}
          isAdmin={session?.user?.isAdmin ?? false}
          evidenceA={evidence.playerA}
          evidenceB={evidence.playerB}
        />
      )}

      {!showResolvedRecordings && fight.wagerAmount > 0 && (
        <div className="mt-8">
          <RecordingNotice />
        </div>
      )}
    </PageShell>
  );
}
