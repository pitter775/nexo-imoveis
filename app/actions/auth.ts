'use server';

import { redirect } from 'next/navigation';
import { login, logout } from '@/lib/auth';
import { createSession } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/password';
import { createAdminClient } from '@/lib/supabase/admin';

export type LoginFormState = {
  error?: string;
};

export type RegisterFormState = {
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

  const authenticatedUser = await login(email, password);

  if (!authenticatedUser) {
    return {
      error: 'Nao foi possivel entrar. Verifique e-mail, senha e se o usuario esta ativo.',
    };
  }

  if (authenticatedUser.tipo_usuario === 'admin') {
    redirect('/admin');
  }

  redirect(redirectTo === '/admin' ? '/' : redirectTo);
}

export async function logoutAction() {
  await logout();
  redirect('/login');
}

export async function registerAction(
  _prevState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const nome = String(formData.get('nome') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const telefone = String(formData.get('telefone') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const acceptedTerms = formData.get('acceptedTerms') === 'on';

  if (!nome || !email || !telefone || !password) {
    return { error: 'Preencha nome, e-mail, telefone e senha para continuar.' };
  }

  if (password.length < 6) {
    return { error: 'A senha precisa ter pelo menos 6 caracteres.' };
  }

  if (!acceptedTerms) {
    return { error: 'Aceite os Termos de Uso e a Política de Privacidade.' };
  }

  const supabase = createAdminClient();
  const senha_hash = await hashPassword(password);
  const { data, error } = await supabase
    .from('users')
    .insert({
      nome,
      email,
      telefone,
      senha_hash,
      tipo_usuario: 'cliente',
      ativo: true,
    })
    .select('id, email, tipo_usuario')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { error: 'Já existe uma conta cadastrada com este e-mail.' };
    }

    return { error: `Não foi possível criar sua conta: ${error.message}` };
  }

  await createSession({
    sub: data.id,
    email: data.email,
    tipo_usuario: data.tipo_usuario === 'admin' ? 'admin' : 'cliente',
  });

  redirect('/');
}
