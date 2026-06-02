export const dynamic = "force-dynamic";

import { OnboardingClient } from "@/components/onboarding/OnboardingClient";
import { getOnboardingState } from "@/actions/onboarding";

export default async function OnboardingPage() {
  const initial = await getOnboardingState();
  return <OnboardingClient initial={initial} />;
}
