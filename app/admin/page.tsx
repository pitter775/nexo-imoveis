import { AdminDashboard } from '@/components/admin-dashboard';
import { requireAdmin } from '@/lib/auth';
import { getAdminDashboardData } from '@/lib/admin/dashboard';

export default async function AdminPage() {
  const [profile, data] = await Promise.all([
    requireAdmin(),
    getAdminDashboardData(),
  ]);

  return (
    <AdminDashboard profile={profile} data={data} />
  );
}
