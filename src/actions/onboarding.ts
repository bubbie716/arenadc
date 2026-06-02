"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  ReferralError,
  completeOnboardingWithReferral,
} from "@/server/referrals";
import { getResolvedPlatformSettings } from "@/server/platform-settings";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function getDbUserId() {
  const session = await auth();
  if (!session?.user?.dbUserId) return null;
  return session.user.dbUserId;
}

export async function linkMinecraftUsername(username: string): Promise<ActionResult> {
  const userId = await getDbUserId();
  if (!userId) return { ok: false, error: "Sign in with Discord first." };

  const trimmed = username.trim();
  if (!trimmed || trimmed.length > 16) {
    return { ok: false, error: "Enter a valid Minecraft username." };
  }

  const existing = await prisma.user.findUnique({
    where: { minecraftUsername: trimmed },
  });
  if (existing && existing.id !== userId) {
    return { ok: false, error: "That Minecraft username is already linked." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { minecraftUsername: trimmed },
  });

  revalidatePath("/onboarding");
  revalidatePath("/profile");
  return { ok: true };
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

  if (!userId) {
    return {
      discordConnected: false,
      minecraftUsername: null,
      rulesAccepted: false,
      onboardingComplete: false,
      referralsEnabled: platformSettings.referralsEnabled,
      referralNewUserBonus: platformSettings.referralNewUserBonus,
      referralReferrerBonus: platformSettings.referralReferrerBonus,
    };
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return {
    discordConnected: true,
    minecraftUsername: user.minecraftUsername,
    rulesAccepted: Boolean(user.rulesAcceptedAt),
    onboardingComplete: user.onboardingComplete,
    referralsEnabled: platformSettings.referralsEnabled,
    referralNewUserBonus: platformSettings.referralNewUserBonus,
    referralReferrerBonus: platformSettings.referralReferrerBonus,
  };
}
