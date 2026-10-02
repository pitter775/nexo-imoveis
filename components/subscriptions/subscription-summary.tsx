import type { ManagedSubscription, SubscriptionCharge } from '@/lib/payments/subscription-management-types';
import { hasSubscriptionAccess, paymentMethodLabel, subscriptionLabels, subscriptionStatus } from '@/lib/payments/subscription-policy';

export const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
export const dateLabel = (value: string | null) => value ? new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short', timeZone: 'America/Sao_Paulo',
}).format(new Date(value)) : '—';

export function StatusBadge({ status }: { status: string }) {
  const style = ['ativa', 'pago'].includes(status) ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : ['pendente', 'atrasada', 'recusado'].includes(status) ? 'bg-amber-50 text-amber-800 border-amber-200'
    : 'bg-slate-100 text-slate-600 border-slate-200';
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${style}`}>{subscriptionLabels[status] ?? status}</span>;
}

export function SubscriptionSummary({ subscription }: { subscription: ManagedSubscription }) {
  const status = subscriptionStatus(subscription);
  const access = hasSubscriptionAccess(subscription);
  return <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950 p-6 text-white sm:p-8">
      <div><p className="text-xs font-bold uppercase tracking-[.2em] text-blue-200">Seu plano</p>
        <h2 className="mt-2 text-2xl font-bold">{subscription.plano} · NEXO</h2>
        <p className="mt-2 text-sm text-slate-300">Informações completas de todos os imóveis.</p></div>
      <div><p className="text-3xl font-extrabold">{money(Number(subscription.valor))}<span className="text-sm font-normal text-slate-300"> / mês</span></p>
        <div className="mt-3"><StatusBadge status={status} /></div></div>
    </div>
    <dl className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-4">
      {[
        ['Pagamento', paymentMethodLabel(subscription.metodo)],
        ['Próxima cobrança', dateLabel(subscription.proxima_cobranca)],
        ['Período pago até', dateLabel(subscription.pago_ate)],
        ['Acesso mensal', subscription.acesso_manual === 'suspenso' ? 'Suspenso pelo atendimento'
          : subscription.acesso_manual === 'concedido' && access ? `Cortesia até ${dateLabel(subscription.acesso_manual_ate)}`
          : access ? 'Liberado' : 'Aguardando regularização'],
      ].map(([label, value]) => <div key={label}><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
        <dd className="mt-2 text-sm font-bold text-slate-900">{value}</dd></div>)}
    </dl>
    {subscription.provider !== 'cortesia' && ['pendente', 'atrasada'].includes(status) && <p role="status" className="mx-6 mb-6 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
      {access ? 'Há uma pendência na renovação. Seu período já pago continua disponível.'
        : 'O acesso mensal será liberado após a confirmação do pagamento. Confira sua forma de pagamento e atualize a situação.'}
    </p>}
    {status === 'cancelada' && <p className="mx-6 mb-6 text-sm text-slate-600">A renovação foi cancelada. O período já pago permanece disponível até o vencimento.</p>}
  </section>;
}

export function ChargeHistory({ charges }: { charges: SubscriptionCharge[] }) {
  return <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="text-xl font-bold text-slate-950">Histórico de pagamentos</h2>
    <p className="mt-1 text-sm text-slate-500">Mensalidades desta assinatura, com confirmação do provedor.</p>
    {!charges.length ? <p className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-600">Nenhuma cobrança registrada ainda.</p>
      : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[580px] text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase text-slate-500"><tr>
          {['Vencimento', 'Valor', 'Pagamento', 'Pago em', 'Situação'].map(label => <th className="px-3 py-3" key={label}>{label}</th>)}
        </tr></thead><tbody className="divide-y divide-slate-100">{charges.map(charge => <tr key={charge.id}>
          <td className="px-3 py-4">{dateLabel(charge.vencimento)}</td><td className="px-3 py-4 font-semibold">{money(Number(charge.valor))}</td>
          <td className="px-3 py-4">{paymentMethodLabel(charge.metodo)}</td><td className="px-3 py-4">{dateLabel(charge.pago_em)}</td>
          <td className="px-3 py-4"><StatusBadge status={charge.status} /></td>
        </tr>)}</tbody></table></div>}
  </section>;
}
