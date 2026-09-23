'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { LoaderCircle, Mail, ShieldCheck } from 'lucide-react';
import { forgotPasswordAction, type ForgotPasswordFormState } from '@/app/actions/auth';

const initialState: ForgotPasswordFormState = {};

type ForgotPasswordFormProps = {
  redirectTo?: string;
};

export function ForgotPasswordForm({ redirectTo = '/' }: ForgotPasswordFormProps) {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, initialState);
  const loginHref =
    redirectTo && redirectTo !== '/'
      ? `/login?redirectTo=${encodeURIComponent(redirectTo)}`
      : '/login';

  return (
    <div className="w-full max-w-md rounded-[2rem] border border-white/60 bg-white/90 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur">
      <div className="mb-8 space-y-4">
        <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
          <ShieldCheck className="size-7" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary/80">
            Recuperar acesso
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Redefina sua senha
          </h1>
          <p className="text-sm leading-6 text-slate-500">
            Informe seu e-mail e enviaremos um link seguro para criar uma nova senha.
          </p>
        </div>
      </div>

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="redirectTo" value={redirectTo} />

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-700">E-mail</span>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/10">
            <Mail className="size-4 text-slate-400" />
            <input
              required
              name="email"
              type="email"
              autoComplete="email"
              placeholder="voce@email.com"
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>
        </label>

        {state.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        ) : null}

        {state.success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {state.success}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {isPending ? 'Enviando...' : 'Enviar link de redefinição'}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-5 text-sm text-slate-500">
        <span>Lembrou a senha?</span>
        <Link href={loginHref} className="font-semibold text-primary hover:text-primary/80">
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}
