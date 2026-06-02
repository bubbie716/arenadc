export const dynamic = "force-dynamic";

import { ScheduleFightForm } from "@/components/schedule/ScheduleFightForm";
import { PageShell } from "@/components/PageShell";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
export default async function ScheduleFightPage() {
  const user = await getSessionUser();
  if (!user) redirect("/onboarding");
  if (!user.onboardingComplete) redirect("/onboarding");

  return (
    <PageShell
      title="Schedule Fight"
      description="Challenge a rival or post an open challenge. Scheduling is free — wagers escrow on accept."
      maxWidth="xl"
    >
      <ScheduleFightForm
        walletBalance={user.walletBalance}
        selfMcName={user.minecraftUsername!}
      />
    </PageShell>
  );
}
