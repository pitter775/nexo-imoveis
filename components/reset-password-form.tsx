'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { LoaderCircle, LockKeyhole, ShieldCheck } from 'lucide-react';
import { resetPasswordAction, type ResetPasswordFormState } from '@/app/actions/auth';

const initialState: ResetPasswordFormState = {};

type ResetPasswordFormProps = {
  token?: string;
};

export function ResetPasswordForm({ token = '' }: ResetPasswordFormProps) {
  const [state, formAction, isPending] = useActionState(resetPasswordAction, initialState);

  return (
    <div className="w-full max-w-md rounded-[2rem] border border-white/60 bg-white/90 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur">
      <div className="mb-8 space-y-4">
        <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
          <ShieldCheck className="size-7" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary/80">
            Nova senha
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Crie sua nova senha
          </h1>
          <p className="text-sm leading-6 text-slate-500">
            Use uma senha com pelo menos 6 caracteres para recuperar o acesso à sua conta.
          </p>
        </div>
      </div>

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="token" value={token} />

        <PasswordField label="Nova senha" name="password" autoComplete="new-password" />
        <PasswordField
          label="Confirmar senha"
          name="confirmPassword"
          autoComplete="new-password"
        />

        {state.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isPending || !token}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {isPending ? 'Salvando...' : 'Salvar nova senha'}
        </button>
      </form>

      {!token ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Link inválido. Solicite uma nova redefinição de senha.
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-5 text-sm text-slate-500">
        <span>Já recuperou?</span>
        <Link href="/login" className="font-semibold text-primary hover:text-primary/80">
          Ir para login
        </Link>
      </div>
    </div>
  );
}

function PasswordField({
  autoComplete,
  label,
  name,
}: {
  autoComplete: string;
  label: string;
  name: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/10">
        <LockKeyhole className="size-4 text-slate-400" />
        <input
          required
          name={name}
          type="password"
          autoComplete={autoComplete}
          placeholder="Digite sua nova senha"
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>
    </label>
  );
}
