import NextAuth, { type Session } from "next-auth";
import type { DiscordProfile } from "next-auth/providers/discord";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";

function shouldGrantAdmin(discordId: string) {
  const adminDiscordId = process.env.ADMIN_DISCORD_ID?.trim();
  return Boolean(adminDiscordId && adminDiscordId === discordId);
}

async function upsertDiscordUser(profile: DiscordProfile) {
  const discordUsername = profile.global_name ?? profile.username;
  const avatarUrl = profile.avatar
    ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
    : null;
  const isAdmin = shouldGrantAdmin(profile.id);

  return prisma.user.upsert({
    where: { discordId: profile.id },
    create: {
      discordId: profile.id,
      discordUsername,
      avatarUrl,
      isAdmin,
    },
    update: {
      discordUsername,
      avatarUrl,
      ...(isAdmin ? { isAdmin: true } : {}),
    },
  });
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    async signIn({ profile }) {
      if (!profile) return false;
      await upsertDiscordUser(profile as DiscordProfile);
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === "discord" && profile) {
        const discord = profile as DiscordProfile;
        const dbUser = await upsertDiscordUser(discord);
        token.discordId = discord.id;
        token.discordUsername = discord.global_name ?? discord.username;
        token.dbUserId = dbUser.id;
        token.onboardingComplete = dbUser.onboardingComplete;
        token.minecraftUsername = dbUser.minecraftUsername;
        token.isAdmin = dbUser.isAdmin;
        token.name = discord.global_name ?? discord.username;
        token.picture = dbUser.avatarUrl ?? undefined;
      }
      return token;
    },
    async session({ session, token }): Promise<Session> {
      const dbUserId = token.dbUserId as string | undefined;
      let onboardingComplete = Boolean(token.onboardingComplete);
      let minecraftUsername: string | null =
        (token.minecraftUsername as string | null) ?? null;
      let isAdmin = Boolean(token.isAdmin);
      let discordUsername = (token.discordUsername as string) ?? "Unknown";
      let image: string | null = (token.picture as string) ?? null;

      if (dbUserId) {
        const dbUser = await prisma.user.findUnique({ where: { id: dbUserId } });
        if (dbUser) {
          onboardingComplete = dbUser.onboardingComplete;
          minecraftUsername = dbUser.minecraftUsername ?? null;
          isAdmin = dbUser.isAdmin;
          discordUsername = dbUser.discordUsername;
          image = dbUser.avatarUrl;
        }
      }

      return {
        expires: session.expires,
        user: {
          id: dbUserId ?? "",
          discordUsername,
          name: token.name ?? null,
          image,
          dbUserId: dbUserId ?? "",
          onboardingComplete,
          minecraftUsername,
          isAdmin,
        },
      };
    },
  },
  events: {
    async signIn({ profile }) {
      if (profile) {
        await upsertDiscordUser(profile as DiscordProfile);
      }
    },
  },
});
