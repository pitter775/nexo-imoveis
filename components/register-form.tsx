'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { LoaderCircle, LockKeyhole, Mail, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { registerAction, type RegisterFormState } from '@/app/actions/auth';

const initialState: RegisterFormState = {};

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);

  return (
    <div className="w-full max-w-md rounded-[2rem] border border-white/60 bg-white/90 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur">
      <div className="mb-8 space-y-4">
        <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
          <ShieldCheck className="size-7" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary/80">
            Cadastro
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Crie sua conta Nexo
          </h1>
          <p className="text-sm leading-6 text-slate-500">
            Cadastre-se para acompanhar oportunidades e solicitar acesso aos detalhes
            dos imóveis.
          </p>
        </div>
      </div>

      <form action={formAction} className="space-y-5">
        <RegisterField
          icon={<UserRound className="size-4 text-slate-400" />}
          label="Nome completo"
          name="nome"
          placeholder="Seu nome"
          autoComplete="name"
          required
        />
        <RegisterField
          icon={<Mail className="size-4 text-slate-400" />}
          label="E-mail"
          name="email"
          type="email"
          placeholder="voce@email.com"
          autoComplete="email"
          required
        />
        <RegisterField
          icon={<Phone className="size-4 text-slate-400" />}
          label="Telefone"
          name="telefone"
          type="tel"
          placeholder="(11) 99999-9999"
          autoComplete="tel"
          required
        />
        <RegisterField
          icon={<LockKeyhole className="size-4 text-slate-400" />}
          label="Senha"
          name="password"
          type="password"
          placeholder="Crie uma senha"
          autoComplete="new-password"
          required
        />

        <label className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
          <input
            required
            name="acceptedTerms"
            type="checkbox"
            className="mt-1 size-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
          <span>
            Li e aceito os{' '}
            <Link href="/termos-de-uso?returnTo=/cadastro" className="font-semibold text-primary hover:text-primary/80">
              Termos de Uso
            </Link>{' '}
            e a{' '}
            <Link
              href="/politica-de-privacidade?returnTo=/cadastro"
              className="font-semibold text-primary hover:text-primary/80"
            >
              Política de Privacidade
            </Link>
            .
          </span>
        </label>

        {state.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {isPending ? 'Criando conta...' : 'Cadastrar'}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-5 text-sm text-slate-500">
        <span>Já tem conta?</span>
        <Link href="/login" className="font-semibold text-primary hover:text-primary/80">
          Acessar
        </Link>
      </div>
    </div>
  );
}

function RegisterField({
  autoComplete,
  icon,
  label,
  name,
  placeholder,
  required,
  type = 'text',
}: {
  autoComplete?: string;
  icon: React.ReactNode;
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/10">
        {icon}
        <input
          required={required}
          name={name}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>
    </label>
  );
}
