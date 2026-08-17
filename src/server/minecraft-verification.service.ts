/**
 * Minecraft coordinate verification — DistrictRP only.
 * Coordinates are server-owned; clients never supply X/Z after creation.
 */
import type { MinecraftChallengeStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateVerificationCoordinates } from "@/lib/minecraft-coordinate-generation";
import {
  MINECRAFT_CHALLENGE_LIFETIME_MS,
  MINECRAFT_CHECK_COOLDOWN_MS,
  MINECRAFT_MAX_REGENERATIONS_PER_HOUR,
  MINECRAFT_REGENERATION_COOLDOWN_MS,
  MINECRAFT_VERIFY_RATE_LIMIT,
  MINECRAFT_VERIFY_RATE_WINDOW_MS,
  MINECRAFT_VERIFICATION_ZONE,
} from "@/lib/minecraft-verification-zone";
import {
  fetchBlueMapPlayers,
  findClaimedPlayerMatch,
  sanitizeClaimedMinecraftUsername,
} from "@/server/bluemap-players";
import { checkRateLimit } from "@/server/rate-limit";
import { getScopedServerId } from "@/server/scope";

export type ChallengePublicView = {
  id: string;
  claimedUsername: string;
  targetWorld: string;
  targetX: number;
  targetZ: number;
  status: MinecraftChallengeStatus;
  expiresAt: string;
  attemptCount: number;
  regenerationCount: number;
  lastCheckedAt: string | null;
  verifiedAt: string | null;
  secondsRemaining: number;
  canRegenerate: boolean;
  regenerateCooldownSeconds: number;
};

export type LocationCheckResult =
  | {
      outcome: "verified";
      verifiedUsername: string;
      challenge: ChallengePublicView;
    }
  | {
      outcome:
        | "offline"
        | "wrong_block"
        | "foreign"
        | "feed_unavailable"
        | "feed_delayed"
        | "expired"
        | "rate_limited"
        | "cooldown"
        | "username_linked"
        | "no_challenge";
      message: string;
      challenge: ChallengePublicView | null;
      retryAfterSeconds?: number;
    };

type ChallengeRow = {
  id: string;
  claimedUsername: string;
  targetWorld: string;
  targetX: number;
  targetZ: number;
  status: MinecraftChallengeStatus;
  expiresAt: Date;
  attemptCount: number;
  regenerationCount: number;
  lastCheckedAt: Date | null;
  verifiedAt: Date | null;
  createdAt: Date;
};

type ActorUser = {
  id: string;
  serverId: string;
  minecraftUsername: string | null;
  minecraftVerifiedAt: Date | null;
};

function toPublicView(row: ChallengeRow, now = Date.now()): ChallengePublicView {
  const secondsRemaining = Math.max(0, Math.floor((row.expiresAt.getTime() - now) / 1000));
  const sinceCreated = now - row.createdAt.getTime();
  const regenerateCooldownMs = Math.max(0, MINECRAFT_REGENERATION_COOLDOWN_MS - sinceCreated);

  return {
    id: row.id,
    claimedUsername: row.claimedUsername,
    targetWorld: row.targetWorld,
    targetX: row.targetX,
    targetZ: row.targetZ,
    status: row.status,
    expiresAt: row.expiresAt.toISOString(),
    attemptCount: row.attemptCount,
    regenerationCount: row.regenerationCount,
    lastCheckedAt: row.lastCheckedAt?.toISOString() ?? null,
    verifiedAt: row.verifiedAt?.toISOString() ?? null,
    secondsRemaining,
    canRegenerate: regenerateCooldownMs <= 0,
    regenerateCooldownSeconds: Math.ceil(regenerateCooldownMs / 1000),
  };
}

async function getActivePendingChallenge(userId: string, serverId: string) {
  const challenge = await prisma.minecraftVerificationChallenge.findFirst({
    where: { userId, serverId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  if (!challenge) return null;

  if (challenge.expiresAt.getTime() <= Date.now()) {
    await prisma.minecraftVerificationChallenge.update({
      where: { id: challenge.id },
      data: { status: "EXPIRED" },
    });
    return null;
  }

  return challenge;
}

export async function getActiveChallengeForUser(
  userId: string,
): Promise<ChallengePublicView | null> {
  const serverId = await getScopedServerId();
  const challenge = await getActivePendingChallenge(userId, serverId);
  return challenge ? toPublicView(challenge) : null;
}

async function countRegenerationsLastHour(userId: string, serverId: string): Promise<number> {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  return prisma.minecraftVerificationChallenge.count({
    where: { userId, serverId, createdAt: { gte: since } },
  });
}

export async function createMinecraftChallenge(
  actor: ActorUser,
  claimedUsernameRaw: string,
): Promise<ChallengePublicView> {
  const serverId = await getScopedServerId();
  const claimedUsername = sanitizeClaimedMinecraftUsername(claimedUsernameRaw);
  if (!claimedUsername) {
    throw new Error("MINECRAFT_USERNAME_INVALID");
  }

  if (actor.minecraftVerifiedAt) {
    throw new Error("MINECRAFT_ALREADY_VERIFIED");
  }

  const regenerations = await countRegenerationsLastHour(actor.id, serverId);
  if (regenerations >= MINECRAFT_MAX_REGENERATIONS_PER_HOUR) {
    throw new Error("MINECRAFT_REGEN_LIMIT");
  }

  const existing = await prisma.minecraftVerificationChallenge.findFirst({
    where: { userId: actor.id, serverId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    const sinceCreated = Date.now() - existing.createdAt.getTime();
    if (sinceCreated < MINECRAFT_REGENERATION_COOLDOWN_MS) {
      throw new Error("MINECRAFT_REGEN_COOLDOWN");
    }
  }

  const coords = generateVerificationCoordinates();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + MINECRAFT_CHALLENGE_LIFETIME_MS);

  const challenge = await prisma.$transaction(async (tx) => {
    await tx.minecraftVerificationChallenge.updateMany({
      where: { userId: actor.id, serverId, status: "PENDING" },
      data: { status: "REPLACED", replacedAt: now },
    });

    return tx.minecraftVerificationChallenge.create({
      data: {
        serverId,
        userId: actor.id,
        claimedUsername,
        targetWorld: MINECRAFT_VERIFICATION_ZONE.world,
        targetX: coords.x,
        targetZ: coords.z,
        status: "PENDING",
        expiresAt,
        regenerationCount: regenerations + (existing ? 1 : 0),
      },
    });
  });

  return toPublicView(challenge);
}

export async function checkMinecraftLocation(actor: ActorUser): Promise<LocationCheckResult> {
  const serverId = await getScopedServerId();

  if (actor.minecraftVerifiedAt) {
    const challenge = await prisma.minecraftVerificationChallenge.findFirst({
      where: { userId: actor.id, serverId, status: "VERIFIED" },
      orderBy: { verifiedAt: "desc" },
    });
    return {
      outcome: "verified",
      verifiedUsername: actor.minecraftUsername ?? "",
      challenge: challenge
        ? toPublicView(challenge)
        : {
            id: "already-verified",
            claimedUsername: actor.minecraftUsername ?? "",
            targetWorld: MINECRAFT_VERIFICATION_ZONE.world,
            targetX: 0,
            targetZ: 0,
            status: "VERIFIED",
            expiresAt: new Date().toISOString(),
            attemptCount: 0,
            regenerationCount: 0,
            lastCheckedAt: null,
            verifiedAt: actor.minecraftVerifiedAt.toISOString(),
            secondsRemaining: 0,
            canRegenerate: false,
            regenerateCooldownSeconds: 0,
          },
    };
  }

  const rate = checkRateLimit({
    key: `minecraft-verify:user:${actor.id}`,
    limit: MINECRAFT_VERIFY_RATE_LIMIT,
    windowMs: MINECRAFT_VERIFY_RATE_WINDOW_MS,
  });
  if (!rate.allowed) {
    return {
      outcome: "rate_limited",
      message: "Too many checks. Wait a moment and try again.",
      challenge: null,
      retryAfterSeconds: Math.ceil(rate.retryAfterMs / 1000),
    };
  }

  const challenge = await getActivePendingChallenge(actor.id, serverId);
  if (!challenge) {
    return {
      outcome: "no_challenge",
      message: "No active challenge. Generate new coordinates.",
      challenge: null,
    };
  }

  if (challenge.expiresAt.getTime() <= Date.now()) {
    await prisma.minecraftVerificationChallenge.update({
      where: { id: challenge.id },
      data: { status: "EXPIRED" },
    });
    return {
      outcome: "expired",
      message: "Challenge expired. Generate new coordinates.",
      challenge: toPublicView({ ...challenge, status: "EXPIRED" }),
    };
  }

  if (challenge.lastCheckedAt) {
    const since = Date.now() - challenge.lastCheckedAt.getTime();
    if (since < MINECRAFT_CHECK_COOLDOWN_MS) {
      return {
        outcome: "cooldown",
        message: "Stay on the block — checking again shortly.",
        challenge: toPublicView(challenge),
        retryAfterSeconds: Math.ceil((MINECRAFT_CHECK_COOLDOWN_MS - since) / 1000),
      };
    }
  }

  await prisma.minecraftVerificationChallenge.update({
    where: { id: challenge.id },
    data: {
      lastCheckedAt: new Date(),
      attemptCount: { increment: 1 },
    },
  });

  const feed = await fetchBlueMapPlayers();
  if (!feed.ok) {
    const refreshed = await prisma.minecraftVerificationChallenge.findUniqueOrThrow({
      where: { id: challenge.id },
    });
    return {
      outcome: feed.reason === "timeout" ? "feed_delayed" : "feed_unavailable",
      message:
        feed.reason === "timeout"
          ? "Live map is still updating. Stay on the block and try again."
          : "Live map is temporarily unavailable. Your coordinates are saved.",
      challenge: toPublicView(refreshed),
    };
  }

  const match = findClaimedPlayerMatch(
    feed.players,
    challenge.claimedUsername,
    challenge.targetX,
    challenge.targetZ,
  );

  const refreshed = await prisma.minecraftVerificationChallenge.findUniqueOrThrow({
    where: { id: challenge.id },
  });

  if (match.status === "offline") {
    return {
      outcome: "offline",
      message: `${challenge.claimedUsername} is not online. Join the server and try again.`,
      challenge: toPublicView(refreshed),
    };
  }
  if (match.status === "foreign") {
    return {
      outcome: "foreign",
      message: "Join the main world before verifying.",
      challenge: toPublicView(refreshed),
    };
  }
  if (match.status === "wrong_block") {
    return {
      outcome: "wrong_block",
      message: `You're online but not on the target block. Stand on X ${challenge.targetX}, Z ${challenge.targetZ} and check again.`,
      challenge: toPublicView(refreshed),
    };
  }

  const linked = await prisma.user.findFirst({
    where: {
      serverId,
      minecraftUuid: match.uuid,
      NOT: { id: actor.id },
    },
    select: { id: true },
  });
  if (linked) {
    return {
      outcome: "username_linked",
      message: "That Minecraft account is already linked to another profile.",
      challenge: toPublicView(refreshed),
    };
  }

  const now = new Date();
  try {
    await prisma.$transaction(async (tx) => {
      const current = await tx.minecraftVerificationChallenge.findUnique({
        where: { id: challenge.id },
      });
      if (!current || current.status !== "PENDING") {
        throw new Error("MINECRAFT_CHALLENGE_NOT_PENDING");
      }

      const userRow = await tx.user.findUnique({ where: { id: actor.id } });
      if (!userRow) throw new Error("USER_NOT_FOUND");
      if (userRow.minecraftVerifiedAt) return;

      const conflict = await tx.user.findFirst({
        where: { serverId, minecraftUuid: match.uuid, NOT: { id: actor.id } },
        select: { id: true },
      });
      if (conflict) throw new Error("MINECRAFT_UUID_LINKED");

      await tx.minecraftVerificationChallenge.update({
        where: { id: challenge.id },
        data: { status: "VERIFIED", verifiedAt: now },
      });

      await tx.user.update({
        where: { id: actor.id },
        data: {
          minecraftUsername: match.name,
          minecraftUuid: match.uuid,
          minecraftVerifiedAt: now,
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "MINECRAFT_UUID_LINKED") {
      return {
        outcome: "username_linked",
        message: "That Minecraft account is already linked to another profile.",
        challenge: toPublicView(refreshed),
      };
    }
    if (error instanceof Error && error.message === "MINECRAFT_CHALLENGE_NOT_PENDING") {
      const user = await prisma.user.findUnique({ where: { id: actor.id } });
      if (user?.minecraftVerifiedAt) {
        return {
          outcome: "verified",
          verifiedUsername: user.minecraftUsername ?? match.name,
          challenge: toPublicView({ ...refreshed, status: "VERIFIED", verifiedAt: now }),
        };
      }
      throw error;
    }
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return {
        outcome: "username_linked",
        message: "That Minecraft account is already linked to another profile.",
        challenge: toPublicView(refreshed),
      };
    }
    throw error;
  }

  return {
    outcome: "verified",
    verifiedUsername: match.name,
    challenge: toPublicView({
      ...refreshed,
      status: "VERIFIED",
      verifiedAt: now,
    }),
  };
}
