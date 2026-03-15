import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { PROTECTED_ROUTE_RULES } from '@/lib/auth/protected-routes';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth/token';

export async function protectRoute(request: NextRequest) {
  const matchedRule = PROTECTED_ROUTE_RULES.find((rule) =>
    request.nextUrl.pathname.startsWith(rule.prefix),
  );

  if (!matchedRule) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const supabase = createAdminClient();
  const { data: user, error } = await supabase
    .from('users')
    .select('id, tipo_usuario, ativo')
    .eq('id', session.sub)
    .maybeSingle();

  if (error || !user || user.ativo !== true) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (matchedRule.requiredRole && user.tipo_usuario !== matchedRule.requiredRole) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = '/';
    homeUrl.search = '';
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}
