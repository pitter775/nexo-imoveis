import type { ReactNode } from 'react';
import {
  BadgeCheck,
  CircleDollarSign,
  Clock3,
  CreditCard,
  KeyRound,
  ReceiptText,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import {
  getAdminPagamentosData,
  type AdminPagamentoItem,
} from '@/lib/admin/pagamentos';

const STATUS_LABELS: Record<string, string> = {
  pago: 'Pago',
  aprovado: 'Pago',
  concluido: 'Pago',
  approved: 'Pago',
  pendente: 'Pendente',
  pending: 'Pendente',
  em_analise: 'Em analise',
  in_process: 'Em analise',
  erro: 'Erro',
  recusado: 'Recusado',
  rejected: 'Recusado',
  cancelado: 'Cancelado',
  estornado: 'Estornado',
};

const STATUS_STYLES: Record<string, string> = {
  pago: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  aprovado: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  concluido: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  pendente: 'border-amber-200 bg-amber-50 text-amber-700',
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  em_analise: 'border-sky-200 bg-sky-50 text-sky-700',
  in_process: 'border-sky-200 bg-sky-50 text-sky-700',
  erro: 'border-rose-200 bg-rose-50 text-rose-700',
  recusado: 'border-rose-200 bg-rose-50 text-rose-700',
  rejected: 'border-rose-200 bg-rose-50 text-rose-700',
  cancelado: 'border-slate-200 bg-slate-100 text-slate-600',
  estornado: 'border-slate-200 bg-slate-100 text-slate-600',
};

export default async function AdminPagamentosPage() {
  const data = await getAdminPagamentosData();

  return (
    <div className="space-y-6">
      <section className="px-1 sm:px-0">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary/80">
              Financeiro
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
              Pagamentos
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Cobranças de informações premium, confirmações de acesso e histórico de
              transações.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-600">
              Checkout ativo
            </p>
            <p className="mt-2 text-sm font-semibold text-emerald-950">
              Solicitação de imóvel: R$ 0,50
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Receita aprovada"
          value={formatCurrency(data.metrics.totalReceita)}
          helper={`${formatNumber(data.metrics.totalPago)} pagamentos`}
          icon={<CircleDollarSign className="size-5 text-primary" />}
        />
        <MetricCard
          title="Pendentes"
          value={formatNumber(data.metrics.totalPendente)}
          helper="Aguardando confirmação"
          icon={<Clock3 className="size-5 text-primary" />}
        />
        <MetricCard
          title="Falhas"
          value={formatNumber(data.metrics.totalFalhou)}
          helper="Recusados ou cancelados"
          icon={<TriangleAlert className="size-5 text-primary" />}
        />
        <MetricCard
          title="Acessos ativos"
          value={formatNumber(data.metrics.acessosAtivos)}
          helper="Imóveis liberados"
          icon={<KeyRound className="size-5 text-primary" />}
        />
        <MetricCard
          title="Ticket médio"
          value={formatCurrency(data.metrics.ticketMedio)}
          helper="Pagamentos aprovados"
          icon={<CreditCard className="size-5 text-primary" />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <PanelHeader
            eyebrow="Status"
            title="Resumo das cobranças"
            icon={<ReceiptText className="size-5 text-primary" />}
          />

          <div className="mt-5 space-y-3">
            {data.statusCounts.length > 0 ? (
              data.statusCounts.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4"
                >
                  <div>
                    <StatusBadge status={item.status} />
                    <p className="mt-2 text-xs text-slate-500">
                      {formatCurrency(item.valor)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-extrabold text-slate-900">
                      {formatNumber(item.total)}
                    </p>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      transações
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState text="Nenhuma cobrança registrada." />
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <PanelHeader
            eyebrow="Acessos"
            title="Imóveis liberados recentemente"
            icon={<ShieldCheck className="size-5 text-primary" />}
          />

          <div className="mt-5 space-y-3">
            {data.acessosRecentes.length > 0 ? (
              data.acessosRecentes.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 md:grid-cols-[1fr_1fr_0.7fr]"
                >
                  <DataBlock label="Cliente" value={item.userLabel} />
                  <DataBlock label="Imóvel" value={item.imovelLabel} />
                  <DataBlock label="Liberado em" value={formatDateTime(item.dataCompra)} />
                </div>
              ))
            ) : (
              <EmptyState text="Nenhum acesso liberado ainda." />
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <PanelHeader
          eyebrow="Histórico"
          title="Últimos pagamentos"
          icon={<BadgeCheck className="size-5 text-primary" />}
        />

        <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200">
          <div className="hidden grid-cols-[0.85fr_1.25fr_1.35fr_0.75fr_0.8fr_0.8fr] gap-4 border-b border-slate-100 bg-slate-50/80 px-5 py-4 text-xs font-bold uppercase tracking-[0.22em] text-slate-400 xl:grid">
            <span>Status</span>
            <span>Cliente</span>
            <span>Imóvel</span>
            <span>Valor</span>
            <span>Quando</span>
            <span>Acesso</span>
          </div>

          <div className="divide-y divide-slate-100">
            {data.pagamentos.length > 0 ? (
              data.pagamentos.map((pagamento) => (
                <PaymentRow key={pagamento.id} pagamento={pagamento} />
              ))
            ) : (
              <EmptyState text="Nenhum pagamento registrado." />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function PaymentRow({ pagamento }: { pagamento: AdminPagamentoItem }) {
  return (
    <div className="grid gap-4 px-4 py-4 sm:px-5 xl:grid-cols-[0.85fr_1.25fr_1.35fr_0.75fr_0.8fr_0.8fr]">
      <div className="xl:self-center">
        <MobileLabel>Status</MobileLabel>
        <StatusBadge status={pagamento.status} />
        {pagamento.gatewayReference ? (
          <p className="mt-2 truncate text-[11px] font-medium text-slate-400">
            {pagamento.gatewayReference}
          </p>
        ) : null}
      </div>
      <DataBlock label="Cliente" value={pagamento.userLabel} helper={pagamento.userEmail} />
      <DataBlock
        label="Imóvel"
        value={pagamento.imovelLabel}
        helper={pagamento.imovelLocation}
      />
      <DataBlock
        label="Valor"
        value={formatCurrency(pagamento.valor)}
        helper={formatPaymentMethod(pagamento.metodo)}
      />
      <DataBlock label="Quando" value={formatDateTime(pagamento.createdAt)} />
      <div className="xl:self-center">
        <MobileLabel>Acesso</MobileLabel>
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
            pagamento.hasAccess
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-slate-200 bg-slate-100 text-slate-500'
          }`}
        >
          {pagamento.hasAccess ? 'Liberado' : 'Não liberado'}
        </span>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  helper,
  icon,
}: {
  title: string;
  value: string;
  helper: string;
  icon: ReactNode;
}) {
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

function PanelHeader({
  eyebrow,
  title,
  icon,
}: {
  eyebrow: string;
  title: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-2xl bg-primary/10 p-3">{icon}</div>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-primary/80">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">{title}</h2>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
        STATUS_STYLES[status] ?? 'border-slate-200 bg-slate-100 text-slate-600'
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function DataBlock({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="min-w-0 xl:self-center">
      <MobileLabel>{label}</MobileLabel>
      <p className="truncate text-sm font-semibold text-slate-800">{value}</p>
      {helper ? <p className="mt-1 truncate text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

function MobileLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 xl:hidden">
      {children}
    </span>
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
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatPaymentMethod(value: string) {
  const normalized = value.toLowerCase();

  if (normalized === 'mercado_pago') {
    return 'Mercado Pago';
  }

  if (normalized === 'pix') {
    return 'Pix';
  }

  return value;
}
