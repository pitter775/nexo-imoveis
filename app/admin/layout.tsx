import type { ReactNode } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { requireAdmin } from '@/lib/auth';
import { subscriptionManagementEnabled } from '@/lib/payments/subscription-management-db';

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await requireAdmin();

  return <AdminShell profile={profile} subscriptionsEnabled={subscriptionManagementEnabled()}>{children}</AdminShell>;
}
