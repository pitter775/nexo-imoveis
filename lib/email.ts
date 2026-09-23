import 'server-only';

import nodemailer from 'nodemailer';

type PasswordResetEmailInput = {
  email: string;
  resetUrl: string;
};

function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!host || !user || !pass) {
    return null;
  }

  return {
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  };
}

export async function sendPasswordResetEmail({ email, resetUrl }: PasswordResetEmailInput) {
  const smtpConfig = getSmtpConfig();
  const from = process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim();

  if (!smtpConfig || !from) {
    console.warn('[email] SMTP not configured; password reset link was not sent.', {
      email,
      resetUrl,
    });
    return;
  }

  const transporter = nodemailer.createTransport(smtpConfig);

  await transporter.sendMail({
    from,
    to: email,
    subject: 'Redefinição de senha | Nexo Leilões',
    text: [
      'Recebemos uma solicitação para redefinir sua senha na Nexo Leilões.',
      '',
      'Acesse o link abaixo para criar uma nova senha. Ele expira em 30 minutos:',
      resetUrl,
      '',
      'Se você não solicitou essa alteração, ignore este e-mail.',
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
        <h1 style="font-size: 22px;">Redefinição de senha</h1>
        <p>Recebemos uma solicitação para redefinir sua senha na Nexo Leilões.</p>
        <p>Use o botão abaixo para criar uma nova senha. O link expira em 30 minutos.</p>
        <p>
          <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 18px; border-radius: 10px; text-decoration: none; font-weight: 700;">
            Redefinir senha
          </a>
        </p>
        <p style="font-size: 13px; color: #64748b;">Se você não solicitou essa alteração, ignore este e-mail.</p>
      </div>
    `,
  });
}
