import { AdminDashboard } from '@/components/admin-dashboard';
import { requireAdmin } from '@/lib/auth';

export default async function AdminPage() {
  const profile = await requireAdmin();

  return (
    <AdminDashboard profile={profile} />
  );
}
