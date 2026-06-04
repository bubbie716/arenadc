import { NotificationType } from "@prisma/client";
import { displayReferralCode } from "@/lib/referral-code";
import { getActiveServerConfig } from "@/lib/server-context";
import { formatCurrency } from "@/lib/utils";
import { sendNotifications } from "@/server/notifications/dispatch";

export type ReferralRedemptionNotificationParams = {
  referredUserId: string;
  referrerId: string;
  referredName: string;
  referrerName: string;
  referralCode: string;
  newUserBonus: number;
  referrerBonus: number;
};

async function bonusPhrase(amount: number) {
  const config = await getActiveServerConfig();
  return amount > 0 ? ` You received ${formatCurrency(amount, config)}.` : "";
}

async function earnedPhrase(amount: number) {
  const config = await getActiveServerConfig();
  return amount > 0 ? ` You earned ${formatCurrency(amount, config)}.` : "";
}

export async function notifyReferralRedemption(
  params: ReferralRedemptionNotificationParams,
): Promise<void> {
  const code = displayReferralCode(params.referralCode);
  const referrerName = params.referrerName || "A fighter";
  const referredName = params.referredName || "A new fighter";

  await sendNotifications([
    {
      userId: params.referredUserId,
      type: NotificationType.REFERRAL_BONUS_RECEIVED,
      title: "Referral bonus received",
      message: `You used ${referrerName}'s referral code (${code}).${await bonusPhrase(params.newUserBonus)}`,
    },
    {
      userId: params.referrerId,
      type: NotificationType.REFERRAL_BONUS_EARNED,
      title: "Referral code used",
      message: `${referredName} used your referral code (${code}).${await earnedPhrase(params.referrerBonus)}`,
    },
  ]);
}
