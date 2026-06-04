import { WalletTransactionType } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import {
  displayReferralCode,
  generateReferralCode,
  referralCodeLookupValues,
  referralCodeStorageVariants,
  validateCustomReferralCode,
} from "@/lib/referral-code";
import type { ServerId } from "@/lib/server-config";
import { postLedgerEntry } from "@/lib/wallet/ledger";
import { prisma } from "@/lib/prisma";
import { notifyReferralRedemption } from "@/server/notifications/referrals";
import { getResolvedPlatformSettings } from "@/server/platform-settings";
import { getScopedServerId } from "@/server/scope";

const MAX_CODE_ATTEMPTS = 10;
export const REFERRAL_CODE_LOCK_DAYS = 14;

function referralCodeLockUntil(from = new Date()): Date {
  const until = new Date(from);
  until.setDate(until.getDate() + REFERRAL_CODE_LOCK_DAYS);
  return until;
}

export function isReferralCodeChangeLocked(lockedUntil: Date | null | undefined): boolean {
  return Boolean(lockedUntil && lockedUntil > new Date());
}

export class ReferralError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReferralError";
  }
}

export { displayReferralCode };

export async function setUserReferralCode(userId: string, rawCode: string): Promise<string> {
  const serverId = await getScopedServerId();
  const settings = await getResolvedPlatformSettings();
  if (!settings.referralsEnabled) {
    throw new ReferralError("Referrals are currently disabled.");
  }

  const validated = validateCustomReferralCode(rawCode);
  if (!validated.ok) {
    throw new ReferralError(validated.error);
  }

  const code = validated.code;
  const variants = referralCodeStorageVariants(code);

  const taken = await prisma.user.findFirst({
    where: {
      serverId,
      referralCode: { in: variants },
      NOT: { id: userId },
    },
    select: { id: true },
  });

  if (taken) {
    throw new ReferralError("That referral code is already taken.");
  }

  const current = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { referralCode: true, referralCodeLockedUntil: true },
  });

  const currentDisplay = current.referralCode
    ? displayReferralCode(current.referralCode)
    : null;
  if (currentDisplay === code) {
    return code;
  }

  if (isReferralCodeChangeLocked(current.referralCodeLockedUntil)) {
    const unlockDate = current.referralCodeLockedUntil!.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    throw new ReferralError(
      `Your referral code is locked until ${unlockDate}. You can change it again after 14 days.`,
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      referralCode: code,
      referralCodeLockedUntil: referralCodeLockUntil(),
    },
  });

  return code;
}

export async function ensureUserReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { referralCode: true },
  });

  if (user.referralCode) {
    return displayReferralCode(user.referralCode);
  }

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const code = generateReferralCode();
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
        select: { referralCode: true },
      });
      return updated.referralCode!;
    } catch (e) {
      if (
        e instanceof Error &&
        "code" in e &&
        (e as { code?: string }).code === "P2002"
      ) {
        continue;
      }
      throw e;
    }
  }

  throw new Error("REFERRAL_CODE_GENERATION_FAILED");
}

export async function getReferralStatsForUser(userId: string) {
  const serverId = await getScopedServerId();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { referralCode: true, referralCodeLockedUntil: true },
  });

  const [redemptions, code] = await Promise.all([
    prisma.referralRedemption.findMany({
      where: { referrerId: userId, serverId },
      select: { referrerBonus: true },
    }),
    user.referralCode
      ? Promise.resolve(displayReferralCode(user.referralCode))
      : ensureUserReferralCode(userId),
  ]);

  return {
    referralCode: code,
    referralsCount: redemptions.length,
    totalEarned: redemptions.reduce((sum, r) => sum + r.referrerBonus, 0),
    referralCodeLockedUntil: user.referralCodeLockedUntil?.toISOString() ?? null,
  };
}

type RedeemReferralParams = {
  referredUserId: string;
  code: string;
  serverId: ServerId;
  tx: Prisma.TransactionClient;
};

export type ReferralRedemptionResult = {
  referredUserId: string;
  referrerId: string;
  referredName: string;
  referrerName: string;
  referralCode: string;
  newUserBonus: number;
  referrerBonus: number;
};

export async function redeemReferralInTransaction({
  referredUserId,
  code,
  serverId,
  tx,
}: RedeemReferralParams): Promise<ReferralRedemptionResult | undefined> {
  if (!code.trim()) {
    return undefined;
  }

  const settings = await getResolvedPlatformSettings();
  if (!settings.referralsEnabled) {
    throw new ReferralError("Referrals are currently disabled.");
  }

  const referredUser = await tx.user.findUniqueOrThrow({
    where: { id: referredUserId },
    select: {
      id: true,
      onboardingComplete: true,
      minecraftUsername: true,
      referralReceived: { select: { id: true } },
    },
  });

  if (referredUser.onboardingComplete) {
    throw new ReferralError("Referral codes can only be used during onboarding.");
  }
  if (referredUser.referralReceived) {
    throw new ReferralError("You have already used a referral code.");
  }

  const lookupValues = referralCodeLookupValues(code);
  if (lookupValues.length === 0) {
    throw new ReferralError("Invalid referral code.");
  }

  const referrer = await tx.user.findFirst({
    where: { serverId, referralCode: { in: lookupValues } },
    select: {
      id: true,
      onboardingComplete: true,
      suspendedAt: true,
      minecraftUsername: true,
      discordUsername: true,
    },
  });

  if (!referrer) {
    throw new ReferralError("Invalid referral code.");
  }
  if (referrer.id === referredUserId) {
    throw new ReferralError("You cannot use your own referral code.");
  }
  if (!referrer.onboardingComplete) {
    throw new ReferralError("That referral code is not available.");
  }
  if (referrer.suspendedAt) {
    throw new ReferralError("That referral code is not available.");
  }

  const newUserBonus = settings.referralNewUserBonus;
  const referrerBonus = settings.referralReferrerBonus;

  await tx.referralRedemption.create({
    data: {
      serverId,
      referrerId: referrer.id,
      referredUserId,
      newUserBonus,
      referrerBonus,
    },
  });

  const referredName = referredUser.minecraftUsername ?? "New fighter";

  if (newUserBonus > 0) {
    await postLedgerEntry(tx, {
      userId: referredUserId,
      type: WalletTransactionType.REFERRAL_BONUS,
      amount: newUserBonus,
      description: "Referral bonus — welcome",
    });
  }

  if (referrerBonus > 0) {
    await postLedgerEntry(tx, {
      userId: referrer.id,
      type: WalletTransactionType.REFERRAL_BONUS,
      amount: referrerBonus,
      description: `Referral bonus — ${referredName} joined`,
    });
  }

  return {
    referredUserId,
    referrerId: referrer.id,
    referredName: referredUser.minecraftUsername ?? "New fighter",
    referrerName: referrer.minecraftUsername ?? referrer.discordUsername,
    referralCode: code,
    newUserBonus,
    referrerBonus,
  };
}

export async function completeOnboardingWithReferral(
  userId: string,
  referralCode?: string,
) {
  const serverId = await getScopedServerId();
  let redemption: ReferralRedemptionResult | undefined;

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        minecraftUsername: true,
        rulesAcceptedAt: true,
        onboardingComplete: true,
      },
    });

    if (!user.minecraftUsername) {
      throw new ReferralError("Link your Minecraft username first.");
    }
    if (!user.rulesAcceptedAt) {
      throw new ReferralError("Accept all legal agreements first.");
    }
    if (user.onboardingComplete) {
      throw new ReferralError("Onboarding is already complete.");
    }

    if (referralCode?.trim()) {
      redemption = await redeemReferralInTransaction({
        referredUserId: userId,
        code: referralCode,
        serverId,
        tx,
      });
    }

    await tx.user.update({
      where: { id: userId },
      data: { onboardingComplete: true },
    });
  });

  if (redemption) {
    await notifyReferralRedemption(redemption);
  }

  await ensureUserReferralCode(userId);
}
