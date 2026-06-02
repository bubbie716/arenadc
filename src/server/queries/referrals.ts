import { getReferralStatsForUser } from "@/server/referrals";
import { getResolvedPlatformSettings } from "@/server/platform-settings";

export async function getReferralsPageData(userId: string) {
  const platformSettings = await getResolvedPlatformSettings();

  if (!platformSettings.referralsEnabled) {
    return {
      referralsEnabled: false as const,
    };
  }

  const referral = await getReferralStatsForUser(userId);

  return {
    referralsEnabled: true as const,
    referralCode: referral.referralCode,
    referralsCount: referral.referralsCount,
    totalEarned: referral.totalEarned,
    referralNewUserBonus: platformSettings.referralNewUserBonus,
    referralReferrerBonus: platformSettings.referralReferrerBonus,
    referralCodeLockedUntil: referral.referralCodeLockedUntil,
  };
}

export type ReferralsPageData = Awaited<ReturnType<typeof getReferralsPageData>>;
