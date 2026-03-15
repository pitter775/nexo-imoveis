import type { ReactNode } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { requireAdmin } from '@/lib/auth';

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await requireAdmin();

  return <AdminShell profile={profile}>{children}</AdminShell>;
}
