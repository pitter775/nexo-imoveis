'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type LoginFormState = {
  error?: string;
};

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const redirectTo = String(formData.get('redirectTo') ?? '/');

  if (!email || !password) {
    return { error: 'Preencha e-mail e senha para continuar.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: 'Não foi possível entrar. Confira suas credenciais.' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('tipo_usuario')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profileError || !profile?.tipo_usuario) {
    await supabase.auth.signOut();
    return {
      error: 'Usuário autenticado, mas sem perfil válido na tabela users.',
    };
  }

  if (profile.tipo_usuario === 'admin') {
    redirect('/admin');
  }

  redirect(redirectTo === '/admin' ? '/' : redirectTo);
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
