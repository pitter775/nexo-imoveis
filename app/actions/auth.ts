'use server';

import { redirect } from 'next/navigation';
import { login, logout } from '@/lib/auth';
import { createSession } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/password';
import { createPasswordResetRequest, resetPasswordWithToken } from '@/lib/auth/password-reset';
import { getSafeRedirectPath } from '@/lib/auth/redirect';
import { sendPasswordResetEmail } from '@/lib/email';
import { createAdminClient } from '@/lib/supabase/admin';

export type LoginFormState = {
  error?: string;
};

export type RegisterFormState = {
  error?: string;
};

export type ForgotPasswordFormState = {
  error?: string;
  success?: string;
};

export type ResetPasswordFormState = {
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

  redirect(getSafeRedirectPath(redirectTo));
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
  const redirectTo = String(formData.get('redirectTo') ?? '/');

  if (!nome || !email || !password) {
    return { error: 'Preencha nome, e-mail e senha para continuar.' };
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
      telefone: telefone || null,
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

  redirect(getSafeRedirectPath(redirectTo));
}

export async function forgotPasswordAction(
  _prevState: ForgotPasswordFormState,
  formData: FormData,
): Promise<ForgotPasswordFormState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const redirectTo = getSafeRedirectPath(String(formData.get('redirectTo') ?? '/'));

  if (!email) {
    return { error: 'Informe seu e-mail para recuperar o acesso.' };
  }

  const resetRequest = await createPasswordResetRequest(email, redirectTo);

  if (resetRequest) {
    await sendPasswordResetEmail({
      email,
      resetUrl: resetRequest.resetUrl,
    });
  }

  return {
    success:
      'Se o e-mail estiver cadastrado, enviaremos um link seguro para redefinir a senha.',
  };
}

export async function resetPasswordAction(
  _prevState: ResetPasswordFormState,
  formData: FormData,
): Promise<ResetPasswordFormState> {
  const token = String(formData.get('token') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  if (!token || !password || !confirmPassword) {
    return { error: 'Preencha a nova senha e a confirmação.' };
  }

  if (password.length < 6) {
    return { error: 'A senha precisa ter pelo menos 6 caracteres.' };
  }

  if (password !== confirmPassword) {
    return { error: 'As senhas informadas não conferem.' };
  }

  const result = await resetPasswordWithToken(token, password);

  if (!result.ok) {
    return { error: result.error };
  }

  redirect(`/login?reset=success&redirectTo=${encodeURIComponent(result.redirectTo)}`);
}
