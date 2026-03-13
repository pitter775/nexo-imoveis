import { AdminDashboard } from '@/components/admin-dashboard';
import { requireAdmin } from '@/lib/auth';

export default async function AdminPage() {
  const profile = await requireAdmin();

  return (
    <main className="min-h-screen bg-[#f6f7f8] px-4 py-8 text-slate-900 selection:bg-primary/30 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <AdminDashboard profile={profile} />
      </div>
    </main>
  );
}
