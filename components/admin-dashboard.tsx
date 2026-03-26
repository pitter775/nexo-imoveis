import type { ReactNode } from 'react';
import {
  Activity,
  Bot,
  Building2,
  CircleDollarSign,
  LockKeyhole,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { AppUserProfile } from '@/lib/types';
import type { AdminDashboardData } from '@/lib/admin/dashboard';

type AdminDashboardProps = {
  profile: AppUserProfile;
  data: AdminDashboardData;
};

export function AdminDashboard({ profile, data }: AdminDashboardProps) {
  const maxTrend = Math.max(...data.trend.map((item) => item.total), 1);

  return (
    <div className="space-y-6">
      <section className="px-1 sm:px-0">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary/80">
              Administracao
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
              Painel de controle
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Visao geral da operacao com foco em usuarios, imoveis ativos, acessos
              premium e consumo do assistente de IA.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
              Admin logado
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{profile.email}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Usuarios cadastrados"
          value={formatNumber(data.metrics.totalUsers)}
          helper="Base total da plataforma"
          icon={<Users className="size-5 text-primary" />}
        />
        <StatCard
          title="Imoveis ativos"
          value={formatNumber(data.metrics.totalImoveisAtivos)}
          helper="Disponiveis para navegacao e interesse"
          icon={<Building2 className="size-5 text-primary" />}
        />
        <StatCard
          title="Acessos premium ativos"
          value={formatNumber(data.metrics.totalAcessosAtivos)}
          helper="Clientes com acesso comprado em vigor"
          icon={<LockKeyhole className="size-5 text-primary" />}
        />
        <StatCard
          title="Receita aprovada"
          value={formatCurrency(data.metrics.receitaAprovada)}
          helper="Somatorio de pagamentos aprovados"
          icon={<CircleDollarSign className="size-5 text-primary" />}
        />
        <StatCard
          title="Conversas IA no mes"
          value={formatNumber(data.metrics.conversasIaMes)}
          helper={`${formatNumber(data.metrics.tokensMes)} tokens processados`}
          icon={<Bot className="size-5 text-primary" />}
        />
        <StatCard
          title="Atividade monitorada"
          value={formatNumber(data.recentActivity.length)}
          helper="Eventos recentes de acesso e interesse"
          icon={<Activity className="size-5 text-primary" />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3">
              <TrendingUp className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-primary/80">
                Interesse recente
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Evolucao dos acessos
              </h2>
            </div>
          </div>

          <div className="mt-8 flex h-72 items-end justify-between gap-3">
            {data.trend.map((item) => (
              <div key={item.label} className="flex flex-1 flex-col items-center gap-3">
                <div className="flex h-full w-full items-end rounded-[1.5rem] bg-slate-100/80 p-2">
                  <div
                    className="w-full rounded-[1rem] bg-gradient-to-t from-primary to-[#93c5fd]"
                    style={{
                      height: `${Math.max(16, (item.total / maxTrend) * 100)}%`,
                    }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-900">{item.total}</p>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                    {item.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3">
              <Building2 className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-primary/80">
                Imoveis quentes
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Mais buscados
              </h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {data.topImoveis.length > 0 ? (
              data.topImoveis.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{item.titulo}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.localizacao}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">{item.total}</p>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      acessos
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState text="Ainda nao ha volume suficiente para ranquear imoveis." />
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary/10 p-3">
            <Activity className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-primary/80">
              Movimento recente
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              Ultimas interacoes da plataforma
            </h2>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200">
          <div className="hidden grid-cols-[0.8fr_1.2fr_1.2fr_0.8fr] gap-4 border-b border-slate-100 bg-slate-50/80 px-5 py-4 text-xs font-bold uppercase tracking-[0.22em] text-slate-400 lg:grid">
            <span>Acao</span>
            <span>Usuario</span>
            <span>Imovel</span>
            <span>Quando</span>
          </div>

          <div className="divide-y divide-slate-100">
            {data.recentActivity.length > 0 ? (
              data.recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-4 px-4 py-4 sm:px-5 lg:grid-cols-[0.8fr_1.2fr_1.2fr_0.8fr]"
                >
                  <DashboardCell label="Acao" value={item.action} />
                  <DashboardCell label="Usuario" value={item.userLabel} />
                  <DashboardCell label="Imovel" value={item.imovelLabel} />
                  <DashboardCell label="Quando" value={formatDateTime(item.when)} />
                </div>
              ))
            ) : (
              <EmptyState text="Nenhuma atividade recente foi encontrada." />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

type StatCardProps = {
  title: string;
  value: string;
  helper: string;
  icon: ReactNode;
};

function StatCard({ title, value, helper, icon }: StatCardProps) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">
          {title}
        </p>
        <div className="rounded-2xl bg-primary/10 p-3">{icon}</div>
      </div>
      <p className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{helper}</p>
    </div>
  );
}

function DashboardCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="lg:self-center">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 lg:hidden">
        {label}
      </span>
      <span className="text-sm text-slate-700">{value}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="px-5 py-8 text-sm text-slate-500">{text}</div>;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
