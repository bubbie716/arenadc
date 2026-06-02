import NextAuth, { type Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
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

/** Drop auth fields when the DB user no longer exists (e.g. after prisma migrate reset). */
function clearedAuthToken(token: JWT): JWT {
  return {
    sub: token.sub,
    iat: token.iat,
    exp: token.exp,
    jti: token.jti,
  };
}

async function syncTokenFromDbUserId(token: JWT): Promise<JWT> {
  const dbUserId = token.dbUserId;
  if (!dbUserId) return token;

  const dbUser = await prisma.user.findUnique({
    where: { id: dbUserId },
    select: {
      id: true,
      onboardingComplete: true,
      minecraftUsername: true,
      isAdmin: true,
      discordUsername: true,
      avatarUrl: true,
    },
  });

  if (!dbUser) {
    return clearedAuthToken(token);
  }

  token.onboardingComplete = dbUser.onboardingComplete;
  token.minecraftUsername = dbUser.minecraftUsername;
  token.isAdmin = dbUser.isAdmin;
  token.discordUsername = dbUser.discordUsername;
  token.picture = dbUser.avatarUrl ?? undefined;
  return token;
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
        return token;
      }

      return syncTokenFromDbUserId(token);
    },
    async session({ session, token }): Promise<Session> {
      const dbUserId = token.dbUserId as string | undefined;

      if (!dbUserId) {
        return {
          expires: session.expires,
          user: {
            id: "",
            discordUsername: "Unknown",
            name: null,
            image: null,
            dbUserId: "",
            onboardingComplete: false,
            minecraftUsername: null,
            isAdmin: false,
          },
        };
      }

      return {
        expires: session.expires,
        user: {
          id: dbUserId,
          discordUsername: (token.discordUsername as string) ?? "Unknown",
          name: token.name ?? null,
          image: (token.picture as string) ?? null,
          dbUserId,
          onboardingComplete: Boolean(token.onboardingComplete),
          minecraftUsername: (token.minecraftUsername as string | null) ?? null,
          isAdmin: Boolean(token.isAdmin),
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
