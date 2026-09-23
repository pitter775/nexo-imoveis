import 'server-only';

import { jwtVerify, SignJWT } from 'jose';
import { loginOrCreateGoogleUser } from '@/lib/auth';
import { getSafeRedirectPath } from '@/lib/auth/redirect';
import { getAbsoluteUrl } from '@/lib/site';

type GoogleOAuthState = {
  redirectTo: string;
};

type GoogleProfile = {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
};

function getSessionSecret() {
  const secret = process.env.APP_SESSION_SECRET;

  if (!secret) {
    throw new Error('APP_SESSION_SECRET is required to manage Google OAuth state.');
  }

  return new TextEncoder().encode(secret);
}

function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth não configurado no servidor.');
  }

  return {
    clientId,
    clientSecret,
    redirectUri: getAbsoluteUrl('/api/auth/google/callback'),
  };
}

async function signState(payload: GoogleOAuthState) {
  return new SignJWT({ redirectTo: getSafeRedirectPath(payload.redirectTo) })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(getSessionSecret());
}

async function verifyState(token: string) {
  const { payload } = await jwtVerify(token, getSessionSecret(), {
    algorithms: ['HS256'],
  });

  return {
    redirectTo: getSafeRedirectPath(String(payload.redirectTo ?? '/')),
  } satisfies GoogleOAuthState;
}

export async function buildGoogleAuthorizationUrl(redirectTo: string) {
  const config = getGoogleConfig();
  const state = await signState({ redirectTo });
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');

  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  url.searchParams.set('access_type', 'online');
  url.searchParams.set('include_granted_scopes', 'true');
  url.searchParams.set('prompt', 'select_account');

  return url.toString();
}

export async function completeGoogleCallback(searchParams: URLSearchParams) {
  const code = searchParams.get('code')?.trim();
  const state = searchParams.get('state')?.trim();
  const providerError =
    searchParams.get('error_description')?.trim() || searchParams.get('error')?.trim();

  if (providerError) {
    throw new Error(providerError);
  }

  if (!code || !state) {
    throw new Error('Retorno do Google incompleto.');
  }

  const config = getGoogleConfig();
  const parsedState = await verifyState(state);
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri,
    }),
  });
  const tokenPayload = (await tokenResponse.json()) as { access_token?: string };

  if (!tokenResponse.ok || !tokenPayload.access_token) {
    throw new Error('Falha ao trocar código do Google.');
  }

  const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
  });
  const profile = (await profileResponse.json()) as GoogleProfile;

  if (!profileResponse.ok || !profile.sub || !profile.email) {
    throw new Error('Falha ao carregar perfil do Google.');
  }

  const user = await loginOrCreateGoogleUser({
    email: profile.email,
    nome: profile.name?.trim() || profile.email.split('@')[0],
    avatarUrl: profile.picture?.trim() || null,
  });

  if (!user) {
    throw new Error('Conta Google inativa ou não autorizada.');
  }

  return {
    redirectTo: parsedState.redirectTo,
    user,
  };
}
