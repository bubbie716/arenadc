"use server";

import { requireSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getScopedServerId } from "@/server/scope";

export type OpponentLookupResult =
  | { status: "valid"; username: string }
  | { status: "not_registered" }
  | { status: "self" }
  | { status: "empty" };

export async function lookupRegisteredOpponent(
  mcName: string,
  selfMcName: string | null,
): Promise<OpponentLookupResult> {
  const trimmed = mcName.trim();
  if (!trimmed) return { status: "empty" };

  if (selfMcName && trimmed.toLowerCase() === selfMcName.toLowerCase()) {
    return { status: "self" };
  }

  const serverId = await getScopedServerId();
  const user = await prisma.user.findFirst({
    where: {
      serverId,
      minecraftUsername: { equals: trimmed, mode: "insensitive" },
      onboardingComplete: true,
    },
    select: { minecraftUsername: true },
  });

  if (!user?.minecraftUsername) {
    return { status: "not_registered" };
  }

  return { status: "valid", username: user.minecraftUsername };
}

export async function searchRegisteredOpponents(
  query: string,
  selfMcName: string | null,
): Promise<string[]> {
  await requireSessionUser();
  const serverId = await getScopedServerId();

  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const users = await prisma.user.findMany({
    where: {
      serverId,
      onboardingComplete: true,
      minecraftUsername: {
        not: null,
        contains: trimmed,
        mode: "insensitive",
      },
      ...(selfMcName
        ? {
            NOT: {
              minecraftUsername: { equals: selfMcName, mode: "insensitive" },
            },
          }
        : {}),
    },
    take: 8,
    orderBy: { minecraftUsername: "asc" },
    select: { minecraftUsername: true },
  });

  return users.map((u) => u.minecraftUsername!);
}
