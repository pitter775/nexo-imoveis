import type { ReactNode } from 'react';
import {
  Activity,
  Bot,
  Building2,
  Coins,
  MessagesSquare,
  UserRound,
} from 'lucide-react';
import { getIaTokensOverview } from '@/lib/admin/ia-tokens';

export default async function AdminIaTokensPage() {
  const overview = await getIaTokensOverview();

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/50 bg-white/90 p-6 shadow-xl shadow-slate-900/5 backdrop-blur sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary/80">
              IA Tokens
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
              Consumo de IA da plataforma
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Acompanhe o uso mensal do assistente por imovel, usuario e volume total
              de tokens processados no chat.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-primary/15 bg-primary/5 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary/70">
              Periodo ativo
            </p>
            <p className="mt-2 text-lg font-bold text-slate-900">
              {capitalize(overview.currentMonthLabel)}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Coins className="size-5 text-primary" />}
          label="Tokens do mes"
          value={formatNumber(overview.totalTokens)}
          helper={`${formatNumber(overview.totalInputTokens)} entrada • ${formatNumber(overview.totalOutputTokens)} saida`}
        />
        <MetricCard
          icon={<Bot className="size-5 text-primary" />}
          label="Custo estimado"
          value={formatUsd(overview.totalEstimatedCost)}
          helper="Baseado no modelo configurado no chat"
        />
        <MetricCard
          icon={<MessagesSquare className="size-5 text-primary" />}
          label="Mensagens processadas"
          value={formatNumber(overview.totalMessages)}
          helper={`${formatNumber(overview.totalConversations)} conversas ativas no mes`}
        />
        <MetricCard
          icon={<Building2 className="size-5 text-primary" />}
          label="Imoveis com uso"
          value={formatNumber(overview.imoveisComConsumo)}
          helper={`${formatNumber(overview.usuariosComConsumo)} usuarios consumiram IA`}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-primary/80">
                Ranking por imovel
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                Imoveis com maior consumo
              </h2>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
              Mes atual
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200">
            <div className="hidden grid-cols-[1.8fr_0.8fr_0.8fr_0.7fr] gap-4 border-b border-slate-100 bg-slate-50/80 px-5 py-4 text-xs font-bold uppercase tracking-[0.22em] text-slate-400 lg:grid">
              <span>Imovel</span>
              <span>Mensagens</span>
              <span>Total tokens</span>
              <span>Custo</span>
            </div>

            <div className="divide-y divide-slate-100">
              {overview.topImoveis.length > 0 ? (
                overview.topImoveis.slice(0, 10).map((item, index) => (
                  <div
                    key={item.id}
                    className="grid gap-4 px-4 py-4 sm:px-5 lg:grid-cols-[1.8fr_0.8fr_0.8fr_0.7fr]"
                  >
                    <div className="min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-sm font-bold text-primary">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {item.titulo}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.localizacao}
                          </p>
                        </div>
                      </div>
                    </div>
                    <TableCell label="Mensagens" value={formatNumber(item.messages)} />
                    <TableCell label="Tokens" value={formatNumber(item.totalTokens)} />
                    <TableCell label="Custo" value={formatUsd(item.estimatedCost)} />
                  </div>
                ))
              ) : (
                <EmptyState text="Ainda nao ha consumo de IA registrado neste mes." />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-3">
                <UserRound className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-primary/80">
                  Usuarios
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Quem mais consumiu IA
                </h2>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {overview.topUsuarios.length > 0 ? (
                overview.topUsuarios.slice(0, 6).map((user) => (
                  <div
                    key={user.id}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4"
                  >
                    <p className="font-semibold text-slate-900">{user.nome}</p>
                    <p className="mt-1 text-xs text-slate-500">{user.email}</p>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-slate-500">
                        {formatNumber(user.messages)} mensagens
                      </span>
                      <span className="font-semibold text-slate-800">
                        {formatNumber(user.totalTokens)} tokens
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text="Nenhum usuario consumiu IA neste mes." />
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-3">
                <Activity className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-primary/80">
                  Atividade recente
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Ultimas interacoes
                </h2>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {overview.recentActivity.length > 0 ? (
                overview.recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4"
                  >
                    <p className="font-semibold text-slate-900">{item.titulo}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        {item.tipoChat.replaceAll('_', ' ')}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        {formatNumber(item.totalTokens)} tokens
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                      <span>{formatDateTime(item.when)}</span>
                      <span className="font-semibold text-slate-800">
                        {formatUsd(item.estimatedCost)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text="Ainda nao houve atividade recente para mostrar." />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="rounded-2xl bg-primary/10 p-3">{icon}</div>
      </div>
      <p className="mt-5 text-sm font-bold uppercase tracking-[0.22em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{helper}</p>
    </div>
  );
}

function TableCell({ label, value }: { label: string; value: string }) {
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

function formatUsd(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

function formatDateTime(value: string) {
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

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
