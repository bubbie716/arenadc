import { getServerConfig, type ServerId } from "@/lib/server-config";

export function serverRequiresMinecraftCoordinateVerification(serverId: ServerId): boolean {
  return getServerConfig(serverId).minecraftCoordinateVerification;
}

export function isMinecraftIdentityVerified(
  user: {
    minecraftUsername: string | null;
    minecraftVerifiedAt: Date | null;
  },
  serverId: ServerId,
): boolean {
  if (serverRequiresMinecraftCoordinateVerification(serverId)) {
    return Boolean(user.minecraftVerifiedAt);
  }
  return Boolean(user.minecraftUsername);
}
