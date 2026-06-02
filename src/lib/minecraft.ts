export function minecraftHeadUrl(username: string, size = 128) {
  return `https://api.mcheads.org/head/${encodeURIComponent(username)}/${size}`;
}

export function minecraftPlayerBodyUrl(username: string, size = 256) {
  return `https://api.mcheads.org/player/${encodeURIComponent(username)}/${size}`;
}

export function normalizeMinecraftUsername(
  username: string | undefined | null,
): string | null {
  const trimmed = username?.trim();
  if (!trimmed || trimmed === "TBD" || trimmed === "Unknown") {
    return null;
  }
  return trimmed;
}

export function minecraftHeadInitials(username: string): string {
  const trimmed = username.trim();
  if (!trimmed) return "?";
  return trimmed.slice(0, 2).toUpperCase();
}
