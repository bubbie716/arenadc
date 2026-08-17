import { ArenaMCLogo } from "@/components/ArenaMCLogo";

export function HubShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <ArenaMCLogo size="sm" priority />
            <span className="text-sm font-semibold tracking-tight text-foreground">ArenaMC</span>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border/60 py-10">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <p className="text-xs text-muted">
            ArenaMC — competitive PvP infrastructure for Minecraft servers. In-game currency
            only; no real-money wagering.
          </p>
        </div>
      </footer>
    </div>
  );
}
