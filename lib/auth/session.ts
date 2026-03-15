import 'server-only';

import { cookies } from 'next/headers';
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_IN_SECONDS,
  type SessionPayload,
  verifySessionToken,
} from '@/lib/auth/token';

export async function createSession(payload: SessionPayload) {
  const cookieStore = await cookies();
  const token = await createSessionToken(payload);

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DURATION_IN_SECONDS,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export { SESSION_COOKIE_NAME, verifySessionToken };
