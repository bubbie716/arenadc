import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.dbUserId) return null;

  return prisma.user.findUnique({
    where: { id: session.user.dbUserId },
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
