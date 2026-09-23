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
  telefone: string | null;
  avatar_url: string | null;
  senha_hash: string | null;
  tipo_usuario: 'admin' | 'cliente' | null;
  ativo: boolean | null;
};

const USER_SELECT =
  'id, nome, email, telefone, avatar_url, senha_hash, tipo_usuario, ativo';
const LEGACY_USER_SELECT =
  'id, nome, email, telefone, senha_hash, tipo_usuario, ativo';

function mapDatabaseUserToProfile(user: DatabaseUser): AuthenticatedUser {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    avatar_url: user.avatar_url,
    tipo_usuario: user.tipo_usuario === 'admin' ? 'admin' : 'cliente',
    ativo: user.ativo === true,
  };
}

async function getUserByEmail(email: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('users')
    .select(USER_SELECT)
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (error) {
    if (isMissingAvatarColumn(error.message)) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('users')
        .select(LEGACY_USER_SELECT)
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (fallbackError) {
        throw new Error(`Failed to fetch user by email: ${fallbackError.message}`);
      }

      return fallbackData ? ({ ...fallbackData, avatar_url: null } as DatabaseUser) : null;
    }

    throw new Error(`Failed to fetch user by email: ${error.message}`);
  }

  return data as DatabaseUser | null;
}

async function getUserById(userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('users')
    .select(USER_SELECT)
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    if (isMissingAvatarColumn(error.message)) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('users')
        .select(LEGACY_USER_SELECT)
        .eq('id', userId)
        .maybeSingle();

      if (fallbackError) {
        throw new Error(`Failed to fetch user by id: ${fallbackError.message}`);
      }

      return fallbackData ? ({ ...fallbackData, avatar_url: null } as DatabaseUser) : null;
    }

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

export async function loginOrCreateGoogleUser({
  email,
  nome,
  avatarUrl,
}: {
  email: string;
  nome: string;
  avatarUrl?: string | null;
}) {
  const supabase = createAdminClient();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedAvatarUrl = normalizeAvatarUrl(avatarUrl);
  const existingUser = await getUserByEmail(normalizedEmail);

  if (existingUser) {
    if (existingUser.ativo !== true) {
      return null;
    }

    const updates: Partial<Pick<DatabaseUser, 'nome' | 'avatar_url'>> = {};

    if (!existingUser.nome && nome.trim()) {
      updates.nome = nome.trim();
      existingUser.nome = nome.trim();
    }

    if (normalizedAvatarUrl && existingUser.avatar_url !== normalizedAvatarUrl) {
      updates.avatar_url = normalizedAvatarUrl;
      existingUser.avatar_url = normalizedAvatarUrl;
    }

    if (Object.keys(updates).length > 0) {
      await updateGoogleUserProfile(existingUser.id, updates);
    }

    const authenticatedUser = mapDatabaseUserToProfile(existingUser);

    await createSession({
      sub: authenticatedUser.id,
      email: authenticatedUser.email,
      tipo_usuario: authenticatedUser.tipo_usuario,
    });

    return authenticatedUser;
  }

  const { data, error } = await supabase
    .from('users')
    .insert({
      nome: nome.trim() || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      avatar_url: normalizedAvatarUrl,
      senha_hash: null,
      tipo_usuario: 'cliente',
      ativo: true,
    })
    .select(USER_SELECT)
    .single();

  if (error) {
    if (isMissingAvatarColumn(error.message)) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('users')
        .insert({
          nome: nome.trim() || normalizedEmail.split('@')[0],
          email: normalizedEmail,
          senha_hash: null,
          tipo_usuario: 'cliente',
          ativo: true,
        })
        .select(LEGACY_USER_SELECT)
        .single();

      if (fallbackError) {
        throw new Error(`Failed to create Google user: ${fallbackError.message}`);
      }

      const authenticatedUser = mapDatabaseUserToProfile({
        ...(fallbackData as Omit<DatabaseUser, 'avatar_url'>),
        avatar_url: null,
      });

      await createSession({
        sub: authenticatedUser.id,
        email: authenticatedUser.email,
        tipo_usuario: authenticatedUser.tipo_usuario,
      });

      return authenticatedUser;
    }

    throw new Error(`Failed to create Google user: ${error.message}`);
  }

  const authenticatedUser = mapDatabaseUserToProfile(data as DatabaseUser);

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

async function updateGoogleUserProfile(
  userId: string,
  updates: Partial<Pick<DatabaseUser, 'nome' | 'avatar_url'>>,
) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('users').update(updates).eq('id', userId);

  if (!error) {
    return;
  }

  if (isMissingAvatarColumn(error.message) && updates.nome) {
    const { error: fallbackError } = await supabase
      .from('users')
      .update({ nome: updates.nome })
      .eq('id', userId);

    if (fallbackError) {
      throw new Error(`Failed to update Google user profile: ${fallbackError.message}`);
    }

    return;
  }

  if (!isMissingAvatarColumn(error.message)) {
    throw new Error(`Failed to update Google user profile: ${error.message}`);
  }
}

function normalizeAvatarUrl(value: string | null | undefined) {
  const url = value?.trim();

  if (!url || !/^https:\/\/.+/i.test(url)) {
    return null;
  }

  return url;
}

function isMissingAvatarColumn(message: string) {
  return message.toLowerCase().includes('avatar_url');
}
