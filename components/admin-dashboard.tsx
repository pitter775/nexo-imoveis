import type { ReactNode } from 'react';
import { Bell, DollarSign, Gavel, User } from 'lucide-react';
import type { AppUserProfile } from '@/lib/types';
import { logoutAction } from '@/app/actions/auth';

type AdminDashboardProps = {
  profile: AppUserProfile;
};

export function AdminDashboard({ profile }: AdminDashboardProps) {
  const stats = {
    totalUsers: 25430,
    totalRevenue: 12450000,
    activeAuctions: 42,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-white/50 bg-white/90 p-6 shadow-xl shadow-slate-900/5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary/80">
            Administração
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Painel de controle
          </h1>
          <p className="text-sm text-slate-500">
            Logado como {profile.email}. Perfil identificado como administrador.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20">
            <Bell className="size-4" />
            Notificações
          </button>
          <form action={logoutAction}>
            <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Sair
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard
          title="Total de Usuários"
          value={stats.totalUsers.toLocaleString('pt-BR')}
          helper="+12% desde o mês passado"
          icon={<User className="size-5 text-primary" />}
        />
        <StatCard
          title="Receita Total"
          value={stats.totalRevenue.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            maximumFractionDigits: 0,
          })}
          helper="+8% desde o mês passado"
          icon={<DollarSign className="size-5 text-primary" />}
        />
        <StatCard
          title="Leilões Ativos"
          value={String(stats.activeAuctions)}
          helper="-3% que ontem"
          helperClassName="text-red-600"
          icon={<Gavel className="size-5 text-primary" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Desempenho Regional</h2>
          <div className="mt-6 space-y-4">
            {[
              {
                region: 'América do Norte',
                users: '5.230',
                revenue: 'R$ 120.400',
                status: 'Alto crescimento',
              },
              {
                region: 'União Europeia',
                users: '4.120',
                revenue: 'R$ 98.300',
                status: 'Estável',
              },
              {
                region: 'Ásia-Pacífico',
                users: '2.940',
                revenue: 'R$ 76.100',
                status: 'Recuperando',
              },
            ].map((row) => (
              <div
                key={row.region}
                className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"
              >
                <div>
                  <p className="font-bold text-slate-900">{row.region}</p>
                  <p className="text-xs text-slate-500">{row.users} usuários</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{row.revenue}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-green-600">
                    {row.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Tendência de Receita</h2>
          <div className="mt-8 flex h-64 items-end justify-between gap-2">
            {[60, 45, 80, 55, 70, 90].map((height, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-xl bg-gradient-to-t from-primary to-secondary"
                  style={{ height: `${height}%` }}
                />
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'][index]}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

type StatCardProps = {
  title: string;
  value: string;
  helper: string;
  icon: ReactNode;
  helperClassName?: string;
};

function StatCard({
  title,
  value,
  helper,
  icon,
  helperClassName = 'text-green-600',
}: StatCardProps) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {icon}
      </div>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
      <p className={`mt-2 text-xs font-bold ${helperClassName}`}>{helper}</p>
    </div>
  );
}
