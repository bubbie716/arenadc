"use client";

import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";

export function DiscordConnectButton() {
  const { data: session, status } = useSession();

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
      onClick={() =>
        signIn("discord", {
          callbackUrl: "/onboarding?discord=connected",
        })
      }
    >
      Connect Discord
    </Button>
  );
}
