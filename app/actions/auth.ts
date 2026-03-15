'use server';

import { redirect } from 'next/navigation';
import { login, logout } from '@/lib/auth';

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
