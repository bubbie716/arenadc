import { Navbar } from "./Navbar";
import { SiteFooter } from "./SiteFooter";
import { getDiscordInviteUrlFallback } from "@/lib/discord";

interface PageShellProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  maxWidth?: "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
  discordInviteUrl?: string;
}

const maxWidthClass = {
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-5xl",
  "2xl": "max-w-6xl",
  "3xl": "max-w-7xl",
  full: "max-w-full",
};

export function PageShell({
  children,
  title,
  description,
  maxWidth = "2xl",
  discordInviteUrl = getDiscordInviteUrlFallback(),
}: PageShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className={`mx-auto w-full flex-1 px-4 py-8 sm:px-6 lg:py-10 ${maxWidthClass[maxWidth]}`}>
        {(title || description) && (
          <header className="mb-9">
            {title && (
              <h1 className="text-3xl font-bold tracking-tight sm:text-[2.125rem] sm:leading-tight">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-2.5 max-w-2xl text-muted leading-relaxed">{description}</p>
            )}
          </header>
        )}
        {children}
      </main>
      <SiteFooter discordInviteUrl={discordInviteUrl} />
    </div>
  );
}
