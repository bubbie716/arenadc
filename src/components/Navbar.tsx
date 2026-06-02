"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { ArenaMCLogo } from "@/components/ArenaMCLogo";
import { AccountMenu } from "@/components/AccountMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { cn } from "@/lib/utils";

const baseNavLinks = [
  { href: "/", label: "Home" },
  { href: "/schedule", label: "Schedule" },
  { href: "/wallet", label: "Wallet" },
  { href: "/referrals", label: "Referrals" },
  { href: "/profile", label: "Profile" },
];

const adminLink = { href: "/admin", label: "Admin" };

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navLinks = session?.user?.isAdmin
    ? [...baseNavLinks, adminLink]
    : baseNavLinks;

  const scheduleHref = session?.user?.dbUserId ? "/schedule" : "/onboarding?callbackUrl=/schedule";

  function handleScheduleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!session?.user?.dbUserId) {
      e.preventDefault();
      signIn("discord", { callbackUrl: "/schedule" });
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-5 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 cursor-pointer items-center gap-2.5">
          <ArenaMCLogo size="sm" priority />
          <span className="text-lg font-bold tracking-tight">
            Arena<span className="text-accent">MC</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1.5 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "cursor-pointer rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-accent/20 text-accent-hover ring-1 ring-accent/30"
                  : "text-muted hover:bg-surface-elevated hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {session?.user?.dbUserId && <NotificationBell />}
          <Link
            href={scheduleHref}
            onClick={handleScheduleClick}
            className="hidden cursor-pointer rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover sm:inline-block"
          >
            Schedule Fight
          </Link>
          <AccountMenu />
        </div>
      </div>

      <nav className="flex gap-1.5 overflow-x-auto border-t border-border/50 px-4 py-2.5 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium",
                pathname === link.href
                  ? "bg-accent/20 text-accent-hover ring-1 ring-accent/30"
                  : "text-muted",
              )}
            >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
