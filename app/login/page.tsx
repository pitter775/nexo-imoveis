import { redirectIfAuthenticated } from '@/lib/auth';
import { LoginForm } from '@/components/login-form';

type LoginPageProps = {
  searchParams: Promise<{
    redirectTo?: string;
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  await redirectIfAuthenticated();

  const { redirectTo, error } = await searchParams;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6f7f8] px-4 py-10 text-slate-900 selection:bg-primary/30 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,106,0,0.16),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(255,166,77,0.18),_transparent_30%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col items-center justify-center gap-10 lg:flex-row lg:justify-between">
        <section className="max-w-xl space-y-6">
          <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-primary">
            Login Seguro
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Acesso centralizado para clientes e administradores
            </h2>
            <p className="max-w-lg text-base leading-7 text-slate-600">
              O login segue a identidade visual atual da Nexo e valida o perfil
              diretamente na tabela <code>users</code>, usando <code>tipo_usuario</code>{' '}
              para definir o destino pos-login.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FeatureCard
              title="Clientes"
              description="Entram com as credenciais da tabela users e seguem para a area publica."
            />
            <FeatureCard
              title="Administradores"
              description="Sao identificados pelo campo tipo_usuario e redirecionados para /admin."
            />
          </div>
        </section>

        <div className="w-full max-w-md space-y-4">
          {error === 'unauthorized' ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Sua conta nao tem permissao de administrador para acessar essa area.
            </div>
          ) : null}
          <LoginForm redirectTo={redirectTo} />
        </div>
      </div>
    </main>
  );
}

type FeatureCardProps = {
  title: string;
  description: string;
};

function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <div className="rounded-[1.75rem] border border-white/60 bg-white/80 p-5 shadow-lg shadow-slate-900/5 backdrop-blur">
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
