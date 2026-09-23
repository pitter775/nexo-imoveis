import { NextResponse } from 'next/server';
import { completeGoogleCallback } from '@/lib/auth/google-oauth';

export async function GET(request: Request) {
  const url = new URL(request.url);

  try {
    const result = await completeGoogleCallback(url.searchParams);
    return NextResponse.redirect(new URL(result.redirectTo, url.origin));
  } catch (error) {
    console.error('[auth/google] callback failed', error);

    const target = new URL('/login', url.origin);
    target.searchParams.set('error', 'google');
    return NextResponse.redirect(target);
  }
}
