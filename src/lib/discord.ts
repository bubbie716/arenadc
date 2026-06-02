const DEFAULT_DISCORD_INVITE = "https://discord.gg/arenamc";

export function getDiscordInviteUrlFallback(): string {
  return process.env.NEXT_PUBLIC_DISCORD_INVITE_URL?.trim() || DEFAULT_DISCORD_INVITE;
}
