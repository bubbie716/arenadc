"use server";

import { revalidatePath } from "next/cache";
import { adminErrorMessage, type ActionResult } from "@/actions/admin/_result";
import { AdminAuditAction, logAdminAction } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { PLATFORM_SETTING_KEYS } from "@/server/queries/admin/settings";

export async function adminUpdatePlatformSettings(
  settings: Record<string, string>,
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();

    const allowed = new Set<string>(PLATFORM_SETTING_KEYS);
    const entries = Object.entries(settings).filter(([key]) => allowed.has(key));
    if (entries.length === 0) {
      return { ok: false, error: "No valid settings to update." };
    }

    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.platformSetting.upsert({
          where: { key },
          create: { key, value, updatedById: admin.id },
          update: { value, updatedById: admin.id },
        }),
      ),
    );

    await logAdminAction({
      adminId: admin.id,
      action: AdminAuditAction.SETTINGS_UPDATED,
      targetType: "platform",
      targetId: "settings",
      note: "Platform settings updated",
      metadata: Object.fromEntries(entries),
    });

    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: adminErrorMessage(e) };
  }
}
