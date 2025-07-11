import { getCacheStats, getRecentActivity } from "@/app/actions";
import { DashboardClient } from "@/components/dashboard-client";

export default async function DashboardPage() {
  const initialStats = await getCacheStats();
  const recentActivity = await getRecentActivity();

  return (
    <div className="container relative mx-auto p-4 md:p-8">
      <DashboardClient initialStats={initialStats} initialActivity={recentActivity} />
    </div>
  );
}
