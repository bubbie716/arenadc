import { HubLanding } from "@/components/hub/HubLanding";
import { getHubServerCards, type HubServerPulse } from "@/lib/host-mode";
import { getServerConfig, SERVER_IDS } from "@/lib/server-config";
import { formatCurrency } from "@/lib/utils";
import { getHubServerPulseStatsAll } from "@/server/queries/hub-stats";

export async function renderHubLandingPage() {
  const pulseStats = await getHubServerPulseStatsAll();
  const pulseByServer = Object.fromEntries(
    SERVER_IDS.map((id) => {
      const config = getServerConfig(id);
      const stats = pulseStats[id];
      return [
        id,
        {
          signedUpUsers: stats.signedUpUsers,
          largestPotTodayLabel: formatCurrency(stats.largestPotToday, config, {
            compact: true,
          }),
        } satisfies HubServerPulse,
      ];
    }),
  ) as Record<(typeof SERVER_IDS)[number], HubServerPulse>;

  return <HubLanding servers={getHubServerCards(pulseByServer)} />;
}
