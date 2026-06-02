export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { WalletClient } from "@/components/wallet/WalletClient";
import { PageShell } from "@/components/PageShell";
import { getSessionUser } from "@/lib/auth/session";
import { resolveDiscordInviteUrl } from "@/components/MaintenanceGuard";
import { getWalletData } from "@/server/queries/wallet";

export default async function WalletPage() {
  const user = await getSessionUser();
  if (!user) redirect("/onboarding");
  if (!user.onboardingComplete) redirect("/onboarding");

  const [wallet, discordInviteUrl] = await Promise.all([
    getWalletData(user.id),
    resolveDiscordInviteUrl(),
  ]);

  return (
    <PageShell
      title="Wallet"
      description="Your RMD war chest — balance, escrow, and fight earnings."
      maxWidth="xl"
      discordInviteUrl={discordInviteUrl}
    >
      <WalletClient {...wallet} />
    </PageShell>
  );
}
