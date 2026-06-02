import { FightStatus as DbFightStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";

/** Statuses shown on the public homepage (confirmed / active fights). */
export const HOMEPAGE_VISIBLE_STATUSES: DbFightStatus[] = [
  DbFightStatus.CONFIRMED,
  DbFightStatus.SCHEDULED,
  DbFightStatus.IN_PROGRESS,
  DbFightStatus.AWAITING_RESULT,
  DbFightStatus.AWAITING_RECORDINGS,
  DbFightStatus.DISPUTED,
  DbFightStatus.COMPLETED,
];

/** Open challenges listed publicly before anyone accepts. */
export const HOMEPAGE_OPEN_CHALLENGE_STATUSES: DbFightStatus[] = [DbFightStatus.OPEN];

export const HOMEPAGE_HIDDEN_STATUSES: DbFightStatus[] = [
  DbFightStatus.DRAFT,
  DbFightStatus.PENDING_ACCEPTANCE,
  DbFightStatus.DECLINED,
  DbFightStatus.CANCELLED,
  DbFightStatus.REFUNDED,
];

export const DISPUTE_EVIDENCE_STATUSES: DbFightStatus[] = [
  DbFightStatus.DISPUTED,
  DbFightStatus.AWAITING_RECORDINGS,
];

/** Fights with a final outcome — POV links may be shown publicly. */
export const RESOLVED_FIGHT_STATUSES: DbFightStatus[] = [
  DbFightStatus.COMPLETED,
  DbFightStatus.REFUNDED,
];

export const ACCEPTABLE_FIGHT_STATUSES: DbFightStatus[] = [
  DbFightStatus.OPEN,
  DbFightStatus.PENDING_ACCEPTANCE,
];

export const ACTIVE_FIGHT_STATUSES: DbFightStatus[] = [
  DbFightStatus.CONFIRMED,
  DbFightStatus.SCHEDULED,
  DbFightStatus.IN_PROGRESS,
  DbFightStatus.AWAITING_RESULT,
];

export const REPORTABLE_FIGHT_STATUSES: DbFightStatus[] = [
  DbFightStatus.CONFIRMED,
  DbFightStatus.SCHEDULED,
  DbFightStatus.IN_PROGRESS,
  DbFightStatus.AWAITING_RESULT,
];

/** How long completed fights stay on homepage "Recent Results" / "Biggest Pots". */
export const HOMEPAGE_COMPLETED_VISIBLE_MS = 60 * 60 * 1000;

export function homepageCompletedVisibleSince(): Date {
  return new Date(Date.now() - HOMEPAGE_COMPLETED_VISIBLE_MS);
}

/** Homepage lists: active/open fights, or completed within the visibility window. */
export function homepageFeedWhere(): Prisma.FightWhereInput {
  const completedSince = homepageCompletedVisibleSince();
  return {
    AND: [
      homepageFightWhere(),
      {
        OR: [
          { status: { not: DbFightStatus.COMPLETED } },
          {
            status: DbFightStatus.COMPLETED,
            completedAt: { gte: completedSince },
          },
        ],
      },
    ],
  };
}

/** Prisma filter: public homepage fight feeds. */
export function homepageFightWhere(): Prisma.FightWhereInput {
  return {
    OR: [
      {
        status: { in: HOMEPAGE_VISIBLE_STATUSES },
        playerBId: { not: null },
      },
      {
        isOpenChallenge: true,
        status: { in: HOMEPAGE_OPEN_CHALLENGE_STATUSES },
      },
    ],
  };
}

export function isHomepageVisibleStatus(status: DbFightStatus, isOpenChallenge: boolean): boolean {
  if (isOpenChallenge && HOMEPAGE_OPEN_CHALLENGE_STATUSES.includes(status)) return true;
  return HOMEPAGE_VISIBLE_STATUSES.includes(status);
}
