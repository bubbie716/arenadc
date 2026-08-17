import { auth } from "@/auth";
import { getServerId } from "@/lib/server-context";
import { prisma } from "@/lib/prisma";

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.dbUserId) return null;

  const serverId = await getServerId();

  return prisma.user.findFirst({
    where: {
      id: session.user.dbUserId,
      serverId,
    },
  });
}

export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireOnboardedUser() {
  const user = await requireSessionUser();
  if (!user.onboardingComplete || !user.minecraftUsername) {
    throw new Error("ONBOARDING_REQUIRED");
  }
  return user;
}
