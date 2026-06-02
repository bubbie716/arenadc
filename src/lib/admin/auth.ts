import { requireSessionUser } from "@/lib/auth/session";
import type { User } from "@prisma/client";

export async function requireAdmin(): Promise<User> {
  const user = await requireSessionUser();
  if (!user.isAdmin) {
    throw new Error("ADMIN_REQUIRED");
  }
  return user;
}

export function isAdminActionError(error: unknown): string | null {
  if (error instanceof Error) {
    if (error.message === "ADMIN_REQUIRED") return "Admin access required.";
    if (error.message === "UNAUTHORIZED") return "Sign in required.";
  }
  return null;
}
