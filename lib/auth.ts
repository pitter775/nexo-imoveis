import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { AppUserProfile } from '@/lib/types';

export async function getCurrentUserProfile(): Promise<AppUserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const { data: profile } = await supabase
    .from('users')
    .select('tipo_usuario')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.tipo_usuario) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    tipo_usuario: profile.tipo_usuario,
  };
}

export async function redirectIfAuthenticated() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    return null;
  }

  redirect(profile.tipo_usuario === 'admin' ? '/admin' : '/');
}

export async function requireAdmin() {
  const profile = await getCurrentUserProfile();

  if (!profile || profile.tipo_usuario !== 'admin') {
    redirect('/login?error=unauthorized');
  }

  return profile;
}
