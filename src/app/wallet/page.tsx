export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { WalletClient } from "@/components/wallet/WalletClient";
import { PageShell } from "@/components/PageShell";
import { getSessionUser } from "@/lib/auth/session";
import { resolveDiscordInviteUrl } from "@/components/MaintenanceGuard";
import { getActiveServerConfig } from "@/lib/server-context";
import { getWalletData } from "@/server/queries/wallet";

export default async function WalletPage() {
  const config = await getActiveServerConfig();
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
      description={`Your ${config.currencyCode} war chest — balance, escrow, and fight earnings.`}
      maxWidth="xl"
      discordInviteUrl={discordInviteUrl}
    >
      <WalletClient {...wallet} />
    </PageShell>
  );
}
