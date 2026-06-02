export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ReferralCard } from "@/components/referrals/ReferralCard";
import { PageShell } from "@/components/PageShell";
import { getSessionUser } from "@/lib/auth/session";
import { getSiteOrigin } from "@/lib/site-origin";
import { resolveDiscordInviteUrl } from "@/components/MaintenanceGuard";
import { getReferralsPageData } from "@/server/queries/referrals";

export default async function ReferralsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/onboarding");
  if (!user.onboardingComplete) redirect("/onboarding");

  const [data, discordInviteUrl, siteOrigin] = await Promise.all([
    getReferralsPageData(user.id),
    resolveDiscordInviteUrl(),
    headers().then(getSiteOrigin),
  ]);

  return (
    <PageShell
      title="Referrals"
      description="Share your code and earn RMD when friends join ArenaMC."
      maxWidth="lg"
      discordInviteUrl={discordInviteUrl}
    >
      {data.referralsEnabled ? (
        <ReferralCard
          siteOrigin={siteOrigin}
          referralCode={data.referralCode}
          referralsCount={data.referralsCount}
          totalEarned={data.totalEarned}
          referralNewUserBonus={data.referralNewUserBonus}
          referralReferrerBonus={data.referralReferrerBonus}
          referralCodeLockedUntil={data.referralCodeLockedUntil}
        />
      ) : (
        <p className="rounded-xl border border-border bg-surface px-6 py-8 text-center text-sm text-muted">
          Referrals are currently disabled by platform administrators.
        </p>
      )}
    </PageShell>
  );
}
