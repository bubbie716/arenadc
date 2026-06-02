const DEFAULT_DISCORD_INVITE = "https://discord.gg/REPLACE_ME";

export function getDiscordInviteUrl(): string {
  return process.env.NEXT_PUBLIC_DISCORD_INVITE_URL?.trim() || DEFAULT_DISCORD_INVITE;
}
