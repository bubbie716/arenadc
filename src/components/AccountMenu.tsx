"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function AccountMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <span className="rounded-xl border border-border px-3 py-2 text-sm text-muted">
        …
      </span>
    );
  }

  if (session?.user?.dbUserId) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/profile"
          className={cn(
            "hidden max-w-[140px] cursor-pointer truncate rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground sm:inline-block",
          )}
          title={session.user.minecraftUsername ?? session.user.discordUsername}
        >
          {session.user.minecraftUsername ?? session.user.discordUsername}
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="cursor-pointer rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-accent/40 hover:text-foreground"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => signIn("discord", { callbackUrl: "/onboarding" })}
      className="cursor-pointer rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-accent/40 hover:text-foreground"
    >
      Sign in
    </button>
  );
}
