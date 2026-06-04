"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { toAbsoluteCallbackUrl } from "@/lib/auth/callback-url";

/**
 * After a DB reset the JWT may still reference a deleted user. The server clears
 * dbUserId from the session; this signs the user out so they can Discord sign-in again.
 */
export function StaleSessionGuard() {
  const { data: session, status } = useSession();
  const signingOut = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || signingOut.current) return;

    const hasSessionShell = Boolean(session?.user);
    const hasDbUser = Boolean(session?.user?.dbUserId);

    if (hasSessionShell && !hasDbUser) {
      signingOut.current = true;
      void signOut({ callbackUrl: toAbsoluteCallbackUrl("/onboarding") });
    }
  }, [session, status]);

  return null;
}
