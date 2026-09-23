import { NextResponse } from 'next/server';
import { buildGoogleAuthorizationUrl } from '@/lib/auth/google-oauth';
import { getSafeRedirectPath } from '@/lib/auth/redirect';

export async function GET(request: Request) {
  const url = new URL(request.url);

  try {
    const redirectTo = getSafeRedirectPath(url.searchParams.get('redirectTo'));
    const authorizationUrl = await buildGoogleAuthorizationUrl(redirectTo);

    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    console.error('[auth/google] start failed', error);

    const target = new URL('/login', url.origin);
    target.searchParams.set('error', 'google');
    return NextResponse.redirect(target);
  }
}
