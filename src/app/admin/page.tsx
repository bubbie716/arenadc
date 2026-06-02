export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { getSessionUser } from "@/lib/auth/session";
import { getAdminDashboardData } from "@/server/queries/admin";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/onboarding?callbackUrl=/admin");
  if (!user.isAdmin) redirect("/");

  const data = await getAdminDashboardData();

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6 lg:px-8">
      <AdminDashboard data={data} />
    </div>
  );
}
