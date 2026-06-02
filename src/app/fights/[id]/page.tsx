export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { AcceptFightPanel } from "@/components/fight/AcceptFightPanel";
import { FightConfirmation } from "@/components/FightConfirmation";
import { CommunityPick } from "@/components/fight/CommunityPick";
import { FighterComparison } from "@/components/fight/FighterComparison";
import { FightTimeline } from "@/components/fight/FightTimeline";
import { MatchupHero } from "@/components/fight/MatchupHero";
import { PotShowcase } from "@/components/fight/PotShowcase";
import { DisputeEvidence } from "@/components/fight/DisputeEvidence";
import { FightRecordings } from "@/components/fight/FightRecordings";
import { RecordingNotice } from "@/components/fight/RecordingNotice";
import { DISPUTE_EVIDENCE_STATUSES, RESOLVED_FIGHT_STATUSES } from "@/lib/fight-statuses";
import { FightStatus as DbFightStatus } from "@prisma/client";
import { getLatestEvidenceByFighter } from "@/server/queries/evidence";
import { FighterCard } from "@/components/FighterCard";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/auth";
import { getCommunityPick, getFighterStats } from "@/lib/fighter-stats";
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

  const [{ syncPastScheduledFights }, { repairAllFightDisplayNumbers, ensureFightDisplayNumber }] =
    await Promise.all([
      import("@/server/fight-status"),
      import("@/server/fight-display"),
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
    },
  });

  if (!fightRow) notFound();

  if (fightRow.fightNumber == null || fightRow.fightNumber < 1) {
    fightRow.fightNumber = await ensureFightDisplayNumber(fightRow.id);
  }

  const fight = mapFightToUI(fightRow);
  const [statsA, statsB] = await Promise.all([
    getFighterStats(fight.playerA),
    getFighterStats(fight.playerB),
  ]);
  const communityPick = getCommunityPick(fight.id);
  const dbUserId = session?.user?.dbUserId;
  const mcName = session?.user?.minecraftUsername?.toLowerCase();

  const isCreator = dbUserId === fightRow.createdById;
  const isPlayer = dbUserId === fightRow.playerAId || dbUserId === fightRow.playerBId;
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
    <PageShell maxWidth="xl">
      <MatchupHero fight={fight} />

      {showResolvedRecordings && (
        <FightRecordings
          playerALabel={fight.playerA}
          playerBLabel={fight.playerB}
          evidenceA={evidence.playerA}
          evidenceB={evidence.playerB}
        />
      )}

      <PotShowcase wagerAmount={fight.wagerAmount} />

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Ruleset", value: getRulesetLabel(fight.ruleset) },
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
          wagerAmount={fight.wagerAmount}
          canAccept={canAccept}
          canDecline={canDecline}
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

      {isPlayer &&
        ["confirmed", "scheduled", "in_progress", "awaiting_result"].includes(
          fight.status,
        ) && <FightConfirmation fightId={fight.id} />}

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

      {!showResolvedRecordings && (
        <div className="mt-8">
          <RecordingNotice />
        </div>
      )}
    </PageShell>
  );
}
