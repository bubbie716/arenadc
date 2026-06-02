"use client";

import { useState } from "react";
import {
  minecraftHeadInitials,
  minecraftHeadUrl,
  normalizeMinecraftUsername,
} from "@/lib/minecraft";
import { cn } from "@/lib/utils";

interface MinecraftHeadProps {
  username: string;
  size?: number;
  className?: string;
}

function HeadFallback({
  username,
  size,
  className,
}: {
  username: string;
  size: number;
  className?: string;
}) {
  const label = minecraftHeadInitials(username);

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg border border-border bg-surface-elevated font-bold text-muted",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size <= 32 ? 10 : size <= 56 ? 12 : size <= 80 ? 14 : 16,
      }}
      aria-label={username ? `${username} avatar unavailable` : "Player avatar unavailable"}
    >
      {label}
    </div>
  );
}

export function MinecraftHead({ username, size = 64, className }: MinecraftHeadProps) {
  const [failed, setFailed] = useState(false);
  const validUsername = normalizeMinecraftUsername(username);

  if (!validUsername || failed) {
    return (
      <HeadFallback
        username={(validUsername ?? username.trim()) || "?"}
        size={size}
        className={className}
      />
    );
  }

  return (
    <img
      src={minecraftHeadUrl(validUsername, size)}
      alt={`${validUsername} Minecraft head`}
      width={size}
      height={size}
      className={cn("shrink-0 rounded-lg object-cover", className)}
      style={{ width: size, height: size, imageRendering: "pixelated" }}
      onError={() => setFailed(true)}
    />
  );
}
