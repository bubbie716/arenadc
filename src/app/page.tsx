export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { ArenaHomePage } from "@/components/home/ArenaHomePage";
import { HubLanding } from "@/components/hub/HubLanding";
import { getHubServerCards, isHubHost } from "@/lib/host-mode";
import { getHubActiveUserCounts } from "@/server/queries/hub-stats";

export default async function HomePage() {
  const host = (await headers()).get("host") ?? "";

  if (isHubHost(host)) {
    const activeUsersByServer = await getHubActiveUserCounts();
    return <HubLanding servers={getHubServerCards(activeUsersByServer)} />;
  }

  return <ArenaHomePage />;
}
