import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MaintenanceGuard } from "@/components/MaintenanceGuard";
import { SessionProvider } from "@/components/providers/SessionProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ArenaMC — DemocracyCraft PvP Wagers",
  description:
    "Schedule PvP fights, escrow equal wagers in RMD, and build your public fight record on DemocracyCraft.",
  icons: {
    icon: [{ url: "/arenamc-icon-128.png", sizes: "128x128", type: "image/png" }],
    apple: [{ url: "/arenamc-icon-512.png", sizes: "512x512", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <MaintenanceGuard>{children}</MaintenanceGuard>
        </SessionProvider>
      </body>
    </html>
  );
}
