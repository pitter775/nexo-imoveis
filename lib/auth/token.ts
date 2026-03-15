import { jwtVerify, SignJWT } from 'jose';

export const SESSION_COOKIE_NAME = 'nexo_session';
const SESSION_DURATION_IN_SECONDS = 60 * 60 * 24 * 7;

export type SessionPayload = {
  sub: string;
  email: string;
  tipo_usuario: 'admin' | 'cliente';
};

function getSessionSecret() {
  const sessionSecret = process.env.APP_SESSION_SECRET;

  if (!sessionSecret) {
    throw new Error('APP_SESSION_SECRET is required to manage application sessions.');
  }

  return new TextEncoder().encode(sessionSecret);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({
    email: payload.email,
    tipo_usuario: payload.tipo_usuario,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_IN_SECONDS}s`)
    .sign(getSessionSecret());
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      algorithms: ['HS256'],
    });

    if (
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string' ||
      (payload.tipo_usuario !== 'admin' && payload.tipo_usuario !== 'cliente')
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email,
      tipo_usuario: payload.tipo_usuario,
    } satisfies SessionPayload;
  } catch {
    return null;
  }
}

export { SESSION_DURATION_IN_SECONDS };
