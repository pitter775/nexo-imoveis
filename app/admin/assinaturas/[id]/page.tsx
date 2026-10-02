import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createSubscriptionClient, subscriptionManagementEnabled } from '@/lib/payments/subscription-management-db';
import { getSubscriptionHistory, parsePage } from '@/lib/payments/subscription-queries';
import { ChargeHistory, dateLabel, SubscriptionSummary } from '@/components/subscriptions/subscription-summary';
import { AdminAccessControls } from '@/components/subscriptions/subscription-controls';

export default async function SubscriptionDetail({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin();
  if (!subscriptionManagementEnabled()) notFound();
  const { id } = await params;
  const page = parsePage((await searchParams).page);
  const db = createSubscriptionClient();
  const { data: subscription, error } = await db.from('assinaturas').select('*').eq('id', id).maybeSingle();
  if (error || !subscription) notFound();
  const [history, user] = await Promise.all([
    getSubscriptionHistory(id, page, true), db.from('users').select('nome, email').eq('id', subscription.user_id).single(),
  ]);
  return <div className="space-y-6">
    <Link href="/admin/assinaturas" className="text-sm font-semibold text-primary">← Assinaturas</Link>
    <div><h1 className="text-3xl font-extrabold">{user.data?.nome ?? 'Cliente'}</h1><p className="mt-2 text-sm text-slate-500">{user.data?.email}</p></div>
    <SubscriptionSummary subscription={subscription} />
    {subscription.erro_conciliacao && <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Não foi possível concluir a última conciliação. Confira as configurações e execute novamente antes de alterar o acesso. Última tentativa: {dateLabel(subscription.conciliado_em)}.</p>}
    <AdminAccessControls id={id} />
    <ChargeHistory charges={history.charges} />
    <nav className="flex items-center justify-between text-sm" aria-label="Páginas de cobranças">{page > 1 ? <Link href={`?page=${page - 1}`}>Anterior</Link> : <span />}
      <span>{history.total} cobranças · Página {page}</span>{page * 20 < history.total ? <Link href={`?page=${page + 1}`}>Próxima</Link> : <span />}</nav>
    <section className="rounded-3xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-bold">Auditoria de acesso</h2>
      <p className="mt-2 text-sm text-slate-500">Últimas 30 alterações. Todas as alterações permanecem registradas no banco.</p>
      <div className="mt-4 divide-y divide-slate-100">{history.audit.map(item => <article key={item.id} className="py-4">
        <p className="text-sm font-bold">{item.acao} · {item.administrador}</p>
        <p className="mt-1 text-sm text-slate-600">{item.motivo}</p>
        <time className="mt-2 block text-xs text-slate-400">{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(item.created_at))}</time>
      </article>)}{!history.audit.length && <p className="py-4 text-sm text-slate-500">Nenhuma alteração manual registrada.</p>}</div>
    </section>
  </div>;
}
