import { getCacheStats, getRecentActivity, getKeyHealthStatus } from "@/app/actions";
import { DashboardClient } from "@/components/dashboard-client";

export default async function DashboardPage() {
  const initialStats = await getCacheStats();
  const recentActivity = await getRecentActivity();
  const initialKeyHealth = await getKeyHealthStatus();

  return (
    <div className="container relative mx-auto p-4 md:p-8">
      <DashboardClient 
        initialStats={initialStats} 
        initialActivity={recentActivity} 
        initialKeyHealth={initialKeyHealth}
      />
    </div>
  );
}
