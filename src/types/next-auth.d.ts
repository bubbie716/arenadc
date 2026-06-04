import type { ServerId } from "@/lib/server-config";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      dbUserId: string;
      serverId: ServerId;
      discordUsername: string;
      minecraftUsername: string | null;
      onboardingComplete: boolean;
      isAdmin: boolean;
      name?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    discordId?: string;
    discordUsername?: string;
    dbUserId?: string;
    serverId?: ServerId;
    onboardingComplete?: boolean;
    minecraftUsername?: string | null;
    isAdmin?: boolean;
  }
}
