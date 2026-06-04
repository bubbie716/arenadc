export const dynamic = "force-dynamic";

import { renderHubLandingPage } from "@/lib/hub-page";

/** Hub landing — works on any host (e.g. http://127.0.0.1:3000/hub). */
export default async function HubRoutePage() {
  return renderHubLandingPage();
}
