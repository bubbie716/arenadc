export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { ArenaHomePage } from "@/components/home/ArenaHomePage";
import { renderHubLandingPage } from "@/lib/hub-page";
import { isHubHost } from "@/lib/host-mode";

export default async function HomePage() {
  const host = (await headers()).get("host") ?? "";

  if (isHubHost(host)) {
    return renderHubLandingPage();
  }

  return <ArenaHomePage />;
}
