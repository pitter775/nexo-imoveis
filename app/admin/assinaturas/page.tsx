import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { subscriptionManagementEnabled } from '@/lib/payments/subscription-management-db';
import { getAdminSubscriptions, parsePage } from '@/lib/payments/subscription-queries';
import { paymentMethodLabel, subscriptionStatus } from '@/lib/payments/subscription-policy';
import { dateLabel, money, StatusBadge } from '@/components/subscriptions/subscription-summary';
import { CourtesyForm } from '@/components/subscriptions/subscription-controls';
import { SubscriptionConfiguration } from '@/components/subscriptions/subscription-configuration';

export default async function SubscriptionsPage({ searchParams }: {
  searchParams: Promise<{ status?: string; metodo?: string; inicio?: string; fim?: string; page?: string }>;
}) {
  await requireAdmin();
  if (!subscriptionManagementEnabled()) notFound();
  const params = await searchParams;
  const page = parsePage(params.page);
  const data = await getAdminSubscriptions({ ...params, page });
  function pageLink(next: number) {
    const query = new URLSearchParams();
    for (const key of ['status', 'metodo', 'inicio', 'fim'] as const) if (params[key]) query.set(key, params[key]!);
    query.set('page', String(next)); return `?${query}`;
  }
  const input = 'mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm';
  return <div className="space-y-6">
    <div><p className="text-xs font-bold uppercase tracking-[.2em] text-primary">Financeiro NEXO</p><h1 className="mt-2 text-3xl font-extrabold">Assinaturas</h1>
      <p className="mt-2 text-sm text-slate-500">Cobranças, períodos pagos e exceções de acesso, com histórico por cliente.</p></div>
    <SubscriptionConfiguration />
    <CourtesyForm />
    <form className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 sm:grid-cols-2 xl:grid-cols-5">
      <label className="text-sm font-semibold">Situação<select className={input} name="status" defaultValue={params.status ?? ''}>
        <option value="">Todas</option><option value="ativa">Ativas</option><option value="pendente">Pendentes</option><option value="atrasada">Em atraso</option><option value="cancelada">Canceladas</option><option value="pausada">Pausadas</option>
      </select></label>
      <label className="text-sm font-semibold">Pagamento<select className={input} name="metodo" defaultValue={params.metodo ?? ''}>
        <option value="">Todos</option><option value="cartao">Cartão</option><option value="pix_automatico">Pix Automático</option><option value="pix">Pix</option>
      </select></label>
      <label className="text-sm font-semibold">Contratada desde<input className={input} name="inicio" type="date" defaultValue={params.inicio} /></label>
      <label className="text-sm font-semibold">Contratada até<input className={input} name="fim" type="date" defaultValue={params.fim} /></label>
      <div className="flex items-end gap-3"><button className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white">Filtrar</button><Link href="/admin/assinaturas" className="py-3 text-sm font-semibold text-slate-500">Limpar</Link></div>
    </form>
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto">
      <table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500"><tr>
        {['Cliente', 'Plano', 'Valor mensal', 'Pagamento', 'Próxima cobrança', 'Situação', ''].map((label, index) => <th key={index} className="px-5 py-4">{label}</th>)}
      </tr></thead><tbody className="divide-y divide-slate-100">{data.subscriptions.map(item => <tr key={item.id} className="hover:bg-slate-50">
        <td className="px-5 py-5"><p className="font-semibold">{item.cliente?.nome ?? 'Cliente'}</p><p className="mt-1 text-xs text-slate-500">{item.cliente?.email ?? item.payer_email}</p></td>
        <td className="px-5 py-5">{item.plano}</td><td className="px-5 py-5 font-semibold">{money(Number(item.valor))}</td>
        <td className="px-5 py-5">{paymentMethodLabel(item.metodo)}</td><td className="px-5 py-5">{dateLabel(item.proxima_cobranca)}</td>
        <td className="px-5 py-5"><StatusBadge status={subscriptionStatus(item)} />{item.acesso_manual && <p className="mt-2 text-xs text-slate-500">Acesso {item.acesso_manual}</p>}{item.erro_conciliacao && <p className="mt-2 text-xs text-rose-600">Conciliação requer atenção</p>}</td>
        <td className="px-5 py-5"><Link className="font-bold text-primary" href={`/admin/assinaturas/${item.id}`}>Gerenciar</Link></td>
      </tr>)}</tbody></table>
      {!data.subscriptions.length && <p className="p-10 text-center text-sm text-slate-500">Nenhuma assinatura encontrada para estes filtros.</p>}
    </div></div>
    <nav className="flex items-center justify-between text-sm" aria-label="Páginas de assinaturas">{page > 1 ? <Link href={pageLink(page - 1)}>Anterior</Link> : <span />}
      <span>{data.total} assinaturas · Página {page}</span>{page * 20 < data.total ? <Link href={pageLink(page + 1)}>Próxima</Link> : <span />}</nav>
  </div>;
}
