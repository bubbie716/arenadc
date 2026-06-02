"use client";

import { signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  buildOnboardingDiscordCallbackUrl,
  storeOnboardingRef,
} from "@/lib/onboarding-referral";
import { formatReferralCodeInput } from "@/lib/referral-code";

export function DiscordConnectButton() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();

  if (status === "loading") {
    return (
      <Button disabled variant="secondary">
        Loading…
      </Button>
    );
  }

  if (session?.user) {
    return (
      <p className="rounded-lg bg-success/10 px-4 py-2 text-sm text-success">
        Connected as {session.user.discordUsername}
      </p>
    );
  }

  return (
    <Button
      onClick={() => {
        const ref = formatReferralCodeInput(searchParams.get("ref") ?? "");
        if (ref) storeOnboardingRef(ref);

        signIn("discord", {
          callbackUrl: buildOnboardingDiscordCallbackUrl({
            ref,
            callbackUrl: searchParams.get("callbackUrl"),
          }),
        });
      }}
    >
      Connect Discord
    </Button>
  );
}
