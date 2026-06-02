import type { NextAuthConfig } from "next-auth";
import Discord from "next-auth/providers/discord";
import type { DiscordProfile } from "next-auth/providers/discord";

export const authConfig = {
  trustHost: true,
  providers: [
    Discord({
      authorization: {
        url: "https://discord.com/api/oauth2/authorize",
        params: {
          scope: "identify",
        },
      },
      profile(profile: DiscordProfile) {
        const displayName = profile.global_name ?? profile.username;
        return {
          id: profile.id,
          name: displayName,
          image: profile.avatar
            ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
            : null,
        };
      },
    }),
  ],
  pages: {
    signIn: "/onboarding",
  },
  session: { strategy: "jwt" },
  callbacks: {},
} satisfies NextAuthConfig;
