"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  isMinecraftIdentityVerified,
  serverRequiresMinecraftCoordinateVerification,
} from "@/lib/minecraft-verification";
import {
  ReferralError,
  completeOnboardingWithReferral,
} from "@/server/referrals";
import { getResolvedPlatformSettings } from "@/server/platform-settings";
import { getScopedServerId } from "@/server/scope";
import {
  checkMinecraftLocation as checkMinecraftLocationService,
  createMinecraftChallenge as createMinecraftChallengeService,
  getActiveChallengeForUser,
  type ChallengePublicView,
  type LocationCheckResult,
} from "@/server/minecraft-verification.service";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type MinecraftChallengeView = ChallengePublicView;

export type MinecraftCheckResult = LocationCheckResult;

async function getDbUserId() {
  const session = await auth();
  if (!session?.user?.dbUserId) return null;
  return session.user.dbUserId;
}

async function getActorUser() {
  const userId = await getDbUserId();
  if (!userId) return null;

  const serverId = await getScopedServerId();
  const user = await prisma.user.findFirst({
    where: { id: userId, serverId },
    select: {
      id: true,
      serverId: true,
      minecraftUsername: true,
      minecraftUuid: true,
      minecraftVerifiedAt: true,
      rulesAcceptedAt: true,
      onboardingComplete: true,
    },
  });
  return user;
}

export async function linkMinecraftUsername(username: string): Promise<ActionResult> {
  const user = await getActorUser();
  if (!user) return { ok: false, error: "Sign in with Discord first." };

  const serverId = await getScopedServerId();
  if (serverRequiresMinecraftCoordinateVerification(serverId)) {
    return {
      ok: false,
      error: "DistrictRP requires in-game coordinate verification.",
    };
  }

  const trimmed = username.trim();
  if (!trimmed || trimmed.length > 16) {
    return { ok: false, error: "Enter a valid Minecraft username." };
  }

  const existing = await prisma.user.findFirst({
    where: {
      serverId,
      minecraftUsername: { equals: trimmed, mode: "insensitive" },
    },
  });
  if (existing && existing.id !== user.id) {
    return { ok: false, error: "That Minecraft username is already linked." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { minecraftUsername: trimmed },
  });

  revalidatePath("/onboarding");
  revalidatePath("/profile");
  return { ok: true };
}

export async function createMinecraftChallenge(
  claimedUsername: string,
): Promise<
  { ok: true; challenge: MinecraftChallengeView } | { ok: false; error: string }
> {
  const user = await getActorUser();
  if (!user) return { ok: false, error: "Sign in with Discord first." };

  const serverId = await getScopedServerId();
  if (!serverRequiresMinecraftCoordinateVerification(serverId)) {
    return { ok: false, error: "Coordinate verification is not required on this server." };
  }

  try {
    const challenge = await createMinecraftChallengeService(user, claimedUsername);
    revalidatePath("/onboarding");
    return { ok: true, challenge };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("MINECRAFT_USERNAME_INVALID")) {
      return { ok: false, error: "Enter a valid Minecraft username." };
    }
    if (message.includes("MINECRAFT_REGEN_COOLDOWN")) {
      return { ok: false, error: "Wait before requesting different coordinates." };
    }
    if (message.includes("MINECRAFT_REGEN_LIMIT")) {
      return { ok: false, error: "Coordinate regeneration limit reached. Try again later." };
    }
    if (message.includes("MINECRAFT_ALREADY_VERIFIED")) {
      return { ok: false, error: "Your Minecraft account is already verified." };
    }
    return { ok: false, error: "Could not generate coordinates." };
  }
}

export async function checkMinecraftLocation(): Promise<MinecraftCheckResult> {
  const user = await getActorUser();
  if (!user) {
    return {
      outcome: "no_challenge",
      message: "Sign in with Discord first.",
      challenge: null,
    };
  }

  const serverId = await getScopedServerId();
  if (!serverRequiresMinecraftCoordinateVerification(serverId)) {
    return {
      outcome: "no_challenge",
      message: "Coordinate verification is not required on this server.",
      challenge: null,
    };
  }

  const result = await checkMinecraftLocationService(user);

  if (result.outcome === "verified") {
    revalidatePath("/onboarding");
    revalidatePath("/profile");
  }

  return result;
}

export async function acceptLegalAgreements(): Promise<ActionResult> {
  const userId = await getDbUserId();
  if (!userId) return { ok: false, error: "Sign in with Discord first." };

  await prisma.user.update({
    where: { id: userId },
    data: { rulesAcceptedAt: new Date() },
  });

  revalidatePath("/onboarding");
  return { ok: true };
}

/** @deprecated Use acceptLegalAgreements */
export async function acceptFightRules(): Promise<ActionResult> {
  return acceptLegalAgreements();
}

export async function completeOnboarding(referralCode?: string): Promise<ActionResult> {
  const userId = await getDbUserId();
  if (!userId) return { ok: false, error: "Sign in with Discord first." };

  try {
    await completeOnboardingWithReferral(userId, referralCode);
  } catch (e) {
    if (e instanceof ReferralError) {
      return { ok: false, error: e.message };
    }
    return { ok: false, error: "Could not complete onboarding." };
  }

  revalidatePath("/onboarding");
  revalidatePath("/");
  revalidatePath("/wallet");
  revalidatePath("/referrals");
  revalidatePath("/admin");
  return { ok: true };
}

export async function getOnboardingState() {
  const userId = await getDbUserId();
  const platformSettings = await getResolvedPlatformSettings();
  const serverId = await getScopedServerId();
  const requiresCoordinateVerification =
    serverRequiresMinecraftCoordinateVerification(serverId);

  if (!userId) {
    return {
      discordConnected: false,
      minecraftUsername: null,
      minecraftVerified: false,
      rulesAccepted: false,
      onboardingComplete: false,
      requiresCoordinateVerification,
      minecraftChallenge: null as MinecraftChallengeView | null,
      referralsEnabled: platformSettings.referralsEnabled,
      referralNewUserBonus: platformSettings.referralNewUserBonus,
      referralReferrerBonus: platformSettings.referralReferrerBonus,
    };
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const minecraftVerified = isMinecraftIdentityVerified(user, serverId);
  const minecraftChallenge =
    requiresCoordinateVerification && !user.minecraftVerifiedAt
      ? await getActiveChallengeForUser(userId)
      : null;

  return {
    discordConnected: true,
    minecraftUsername: user.minecraftUsername,
    minecraftVerified,
    rulesAccepted: Boolean(user.rulesAcceptedAt),
    onboardingComplete: user.onboardingComplete,
    requiresCoordinateVerification,
    minecraftChallenge,
    referralsEnabled: platformSettings.referralsEnabled,
    referralNewUserBonus: platformSettings.referralNewUserBonus,
    referralReferrerBonus: platformSettings.referralReferrerBonus,
  };
}
