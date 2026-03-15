import 'server-only';

import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { clearSession, createSession, getSessionFromCookies } from '@/lib/auth/session';
import { validatePassword } from '@/lib/auth/password';
import type { AppUserProfile } from '@/lib/types';
export type AuthenticatedUser = AppUserProfile & {
  ativo: boolean;
};

type DatabaseUser = {
  id: string;
  nome: string | null;
  email: string;
  senha_hash: string | null;
  tipo_usuario: 'admin' | 'cliente' | null;
  ativo: boolean | null;
};

function mapDatabaseUserToProfile(user: DatabaseUser): AuthenticatedUser {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    tipo_usuario: user.tipo_usuario === 'admin' ? 'admin' : 'cliente',
    ativo: user.ativo === true,
  };
}

async function getUserByEmail(email: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, nome, email, senha_hash, tipo_usuario, ativo')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch user by email: ${error.message}`);
  }

  return data as DatabaseUser | null;
}

async function getUserById(userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, nome, email, senha_hash, tipo_usuario, ativo')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch user by id: ${error.message}`);
  }

  return data as DatabaseUser | null;
}

export async function login(email: string, password: string) {
  const user = await getUserByEmail(email);

  if (!user || user.ativo !== true) {
    return null;
  }

  const passwordMatches = await validatePassword(password, user.senha_hash);

  if (!passwordMatches) {
    return null;
  }

  const authenticatedUser = mapDatabaseUserToProfile(user);

  await createSession({
    sub: authenticatedUser.id,
    email: authenticatedUser.email,
    tipo_usuario: authenticatedUser.tipo_usuario,
  });

  return authenticatedUser;
}

export async function logout() {
  await clearSession();
}

export async function getCurrentAuthenticatedUser() {
  const session = await getSessionFromCookies();

  if (!session) {
    return null;
  }

  const user = await getUserById(session.sub);

  if (!user || user.ativo !== true) {
    await clearSession();
    return null;
  }

  return mapDatabaseUserToProfile(user);
}

export async function redirectIfAuthenticated() {
  const user = await getCurrentAuthenticatedUser();

  if (!user) {
    return null;
  }

  redirect(user.tipo_usuario === 'admin' ? '/admin' : '/');
}

export async function requireAuthenticatedUser() {
  const user = await getCurrentAuthenticatedUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireAuthenticatedUser();

  if (user.tipo_usuario !== 'admin') {
    redirect('/');
  }

  return user;
}
