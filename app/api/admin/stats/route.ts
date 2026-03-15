import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getAdminDashboardData } from '@/lib/admin/dashboard';

export async function GET() {
  try {
    await requireAdmin();
    const data = await getAdminDashboardData();

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 },
    );
  }
}
