import { Suspense } from "react";
import { FightEscrowPolicyTabs } from "@/components/legal/FightEscrowPolicyTabs";
import { resolveDiscordInviteUrl } from "@/components/MaintenanceGuard";

export const metadata = {
  title: "Fight Rules & Escrow Policy — ArenaMC",
};

export default async function FightRulesPage() {
  const discordInviteUrl = await resolveDiscordInviteUrl();

  return (
    <Suspense fallback={null}>
      <FightEscrowPolicyTabs discordInviteUrl={discordInviteUrl} />
    </Suspense>
  );
}
