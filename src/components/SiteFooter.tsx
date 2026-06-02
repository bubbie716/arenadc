import Link from "next/link";
import { ArenaMCLogo } from "@/components/ArenaMCLogo";
import { DiscordLink } from "@/components/DiscordLink";

export function SiteFooter({ discordInviteUrl }: { discordInviteUrl: string }) {
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 text-center text-xs text-muted sm:px-6">
        <ArenaMCLogo size="md" />
        <p>
          ArenaMC — DemocracyCraft fan/community PvP wagers. In-game RMD only. No real-money
          gambling. No spectator betting in V1.
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link href="/terms" className="transition-colors hover:text-foreground">
            Terms
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-foreground">
            Privacy
          </Link>
          <Link href="/fight-rules" className="transition-colors hover:text-foreground">
            Fight Rules & Escrow
          </Link>
          <DiscordLink href={discordInviteUrl} />
        </nav>
        <p className="max-w-xl leading-relaxed">
          Not affiliated with Mojang, Microsoft, or DemocracyCraft unless officially authorized.
          Follow DemocracyCraft server rules at all times.
        </p>
      </div>
    </footer>
  );
}
