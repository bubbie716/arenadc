import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { AdminReturnTracker } from "@/components/admin/AdminReturnTracker";
import { MaintenanceGuard } from "@/components/MaintenanceGuard";
import { ServerConfigProvider } from "@/components/providers/ServerConfigProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { headers } from "next/headers";
import { isHubHost } from "@/lib/host-mode";
import { getActiveServerConfig } from "@/lib/server-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host") ?? "";
  if (isHubHost(host)) {
    return {
      title: "ArenaMC — Competitive PvP Infrastructure",
      description:
        "Schedule fights, settle rivalries, track records, and prove who's better. Select your Minecraft server arena.",
      icons: {
        icon: [{ url: "/arenamc-icon-128.png", sizes: "128x128", type: "image/png" }],
        apple: [{ url: "/arenamc-icon-512.png", sizes: "512x512", type: "image/png" }],
      },
    };
  }

  const config = await getActiveServerConfig();
  return {
    title: `ArenaMC — ${config.legalServerName} PvP Wagers`,
    description: `Schedule PvP fights, escrow equal wagers in ${config.currencyCode}, and build your public fight record on ${config.legalServerName}.`,
    icons: {
      icon: [{ url: "/arenamc-icon-128.png", sizes: "128x128", type: "image/png" }],
      apple: [{ url: "/arenamc-icon-512.png", sizes: "512x512", type: "image/png" }],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const serverConfig = await getActiveServerConfig();

  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ServerConfigProvider config={serverConfig}>
          <SessionProvider>
            <Suspense fallback={null}>
              <AdminReturnTracker />
            </Suspense>
            <MaintenanceGuard>{children}</MaintenanceGuard>
          </SessionProvider>
        </ServerConfigProvider>
      </body>
    </html>
  );
}
