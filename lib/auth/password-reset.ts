import 'server-only';

import { createHash, randomBytes } from 'node:crypto';
import { getAbsoluteUrl } from '@/lib/site';
import { hashPassword } from '@/lib/auth/password';
import { getSafeRedirectPath } from '@/lib/auth/redirect';
import { createAdminClient } from '@/lib/supabase/admin';

const PASSWORD_RESET_EXPIRATION_MINUTES = 30;

type PasswordResetTokenRow = {
  id: string;
  user_id: string;
  redirect_to: string | null;
  expires_at: string;
  used_at: string | null;
};

function hashResetToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function getResetUrl(token: string) {
  return getAbsoluteUrl(`/redefinir-senha?token=${encodeURIComponent(token)}`);
}

export async function createPasswordResetRequest(email: string, redirectTo: string) {
  const supabase = createAdminClient();
  const normalizedEmail = email.trim().toLowerCase();

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, ativo')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (userError) {
    throw new Error(`Failed to load user for password reset: ${userError.message}`);
  }

  if (!user || user.ativo !== true) {
    return null;
  }

  const rawToken = randomBytes(32).toString('base64url');
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRATION_MINUTES * 60 * 1000).toISOString();

  const { error: insertError } = await supabase.from('password_reset_tokens').insert({
    user_id: user.id,
    token_hash: tokenHash,
    redirect_to: getSafeRedirectPath(redirectTo),
    expires_at: expiresAt,
  });

  if (insertError) {
    throw new Error(`Failed to create password reset token: ${insertError.message}`);
  }

  return {
    resetUrl: getResetUrl(rawToken),
  };
}

export async function resetPasswordWithToken(token: string, password: string) {
  const supabase = createAdminClient();
  const tokenHash = hashResetToken(token);
  const now = new Date().toISOString();

  const { data: resetToken, error: tokenError } = await supabase
    .from('password_reset_tokens')
    .select('id, user_id, redirect_to, expires_at, used_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (tokenError) {
    throw new Error(`Failed to load password reset token: ${tokenError.message}`);
  }

  const row = resetToken as PasswordResetTokenRow | null;

  if (!row || row.used_at || row.expires_at < now) {
    return {
      ok: false,
      error: 'Link inválido ou expirado. Solicite uma nova redefinição de senha.',
    } as const;
  }

  const senha_hash = await hashPassword(password);
  const [{ error: updateUserError }, { error: consumeTokenError }] = await Promise.all([
    supabase.from('users').update({ senha_hash }).eq('id', row.user_id),
    supabase.from('password_reset_tokens').update({ used_at: now }).eq('id', row.id),
  ]);

  if (updateUserError) {
    throw new Error(`Failed to update password: ${updateUserError.message}`);
  }

  if (consumeTokenError) {
    throw new Error(`Failed to consume password reset token: ${consumeTokenError.message}`);
  }

  return {
    ok: true,
    redirectTo: getSafeRedirectPath(row.redirect_to),
  } as const;
}
