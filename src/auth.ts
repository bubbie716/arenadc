import NextAuth, { type Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { DiscordProfile } from "next-auth/providers/discord";
import { authConfig } from "@/auth.config";
import { getAuthServerId } from "@/lib/auth/server-id";
import type { ServerId } from "@/lib/server-config";
import { prisma } from "@/lib/prisma";

function shouldGrantAdmin(discordId: string) {
  const adminDiscordId = process.env.ADMIN_DISCORD_ID?.trim();
  return Boolean(adminDiscordId && adminDiscordId === discordId);
}

async function upsertDiscordUser(profile: DiscordProfile, serverId: ServerId) {
  const discordUsername = profile.global_name ?? profile.username;
  const avatarUrl = profile.avatar
    ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
    : null;
  const isAdmin = shouldGrantAdmin(profile.id);

  return prisma.user.upsert({
    where: {
      serverId_discordId: {
        serverId,
        discordId: profile.id,
      },
    },
    create: {
      serverId,
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
  const serverId = token.serverId as ServerId | undefined;
  if (!dbUserId || !serverId) return token;

  const dbUser = await prisma.user.findFirst({
    where: { id: dbUserId, serverId },
    select: {
      id: true,
      serverId: true,
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
  token.serverId = dbUser.serverId as ServerId;
  return token;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      try {
        const target = new URL(url);
        const base = new URL(baseUrl);
        if (target.origin === base.origin) {
          return url;
        }
      } catch {
        // ignore malformed url
      }

      return baseUrl;
    },
    async signIn({ profile }) {
      if (!profile) return false;
      const serverId = await getAuthServerId();
      await upsertDiscordUser(profile as DiscordProfile, serverId);
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === "discord" && profile) {
        const discord = profile as DiscordProfile;
        const serverId = await getAuthServerId();
        const dbUser = await upsertDiscordUser(discord, serverId);
        token.discordId = discord.id;
        token.discordUsername = discord.global_name ?? discord.username;
        token.dbUserId = dbUser.id;
        token.serverId = serverId;
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
      const serverId = token.serverId as ServerId | undefined;

      if (!dbUserId || !serverId) {
        return {
          expires: session.expires,
          user: {
            id: "",
            discordUsername: "Unknown",
            name: null,
            image: null,
            dbUserId: "",
            serverId: serverId ?? "dc",
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
          serverId,
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
        const serverId = await getAuthServerId();
        await upsertDiscordUser(profile as DiscordProfile, serverId);
      }
    },
  },
});
