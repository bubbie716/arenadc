"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { StaleSessionGuard } from "@/components/providers/StaleSessionGuard";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider refetchOnWindowFocus>
      <StaleSessionGuard />
      {children}
    </NextAuthSessionProvider>
  );
}
