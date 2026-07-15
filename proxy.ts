import type { NextRequest } from 'next/server';
import { protectRoute } from '@/lib/auth/route-protection';

export async function proxy(request: NextRequest) {
  return protectRoute(request);
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};
