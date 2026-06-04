import { headers } from "next/headers";
import { getSessionUser } from "@/lib/auth/session";
import { isHubHost } from "@/lib/host-mode";
import { getResolvedPlatformSettings } from "@/server/platform-settings";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { getDiscordInviteUrlFallback } from "@/lib/discord";

export async function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const host = (await headers()).get("host") ?? "";
  if (isHubHost(host)) {
    return children;
  }

  const [user, platformSettings] = await Promise.all([
    getSessionUser(),
    getResolvedPlatformSettings(),
  ]);

  if (platformSettings.maintenanceMode && !user?.isAdmin) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Navbar />
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-warning">Maintenance</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">ArenaMC is temporarily offline</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            We&apos;re performing maintenance. Fight scheduling, wallet actions, and other platform
            features will return shortly.
          </p>
        </main>
        <SiteFooter discordInviteUrl={platformSettings.discordInviteUrl} />
      </div>
    );
  }

  return children;
}

export async function resolveDiscordInviteUrl(): Promise<string> {
  try {
    const settings = await getResolvedPlatformSettings();
    return settings.discordInviteUrl;
  } catch {
    return getDiscordInviteUrlFallback();
  }
}
