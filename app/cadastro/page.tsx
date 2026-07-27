import type { Metadata } from 'next';
import { redirectIfAuthenticated } from '@/lib/auth';
import { BrandLogo } from '@/components/brand-logo';
import { RegisterForm } from '@/components/register-form';
import { SiteFooter } from '@/components/site-footer';

export const metadata: Metadata = {
  title: 'Cadastro',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CadastroPage() {
  await redirectIfAuthenticated();

  return (
    <div className="min-h-screen bg-[#f6f7f8] text-slate-900 selection:bg-primary/30">
      <main className="relative overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,106,0,0.16),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(255,166,77,0.18),_transparent_30%)]" />
        <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col items-center justify-center gap-10 lg:flex-row lg:justify-between">
          <section className="max-w-xl space-y-6">
            <BrandLogo href="/" />
            <div className="space-y-4">
              <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
                Oportunidades de leilão com análise e acompanhamento
              </h2>
              <p className="max-w-lg text-base leading-7 text-slate-600">
                Crie sua conta para salvar seu acesso, solicitar informações e
                acompanhar imóveis cadastrados pela equipe Nexo.
              </p>
            </div>
          </section>

          <RegisterForm />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
