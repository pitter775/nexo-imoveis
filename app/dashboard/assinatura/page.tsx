import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { requireAuthenticatedUser } from '@/lib/auth';
import { BrandLogo } from '@/components/brand-logo';
import { subscriptionManagementEnabled } from '@/lib/payments/subscription-management-db';
import { getManagedSubscriptions } from '@/lib/payments/subscription-management';
import { getSubscriptionHistory, parsePage } from '@/lib/payments/subscription-queries';
import { ChargeHistory, SubscriptionSummary } from '@/components/subscriptions/subscription-summary';
import { SubscriptionControls } from '@/components/subscriptions/subscription-controls';

export default async function MySubscriptionPage({ searchParams }: { searchParams: Promise<{ id?: string; page?: string }> }) {
  const user = await requireAuthenticatedUser();
  if (!subscriptionManagementEnabled()) notFound();
  const params = await searchParams;
  const subscriptions = await getManagedSubscriptions(user.id);
  const subscription = params.id ? subscriptions.find(item => item.id === params.id) : subscriptions[0];
  if (params.id && !subscription) notFound();
  const page = parsePage(params.page);
  const history = subscription ? await getSubscriptionHistory(subscription.id, page) : null;
  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
      <BrandLogo href="/" compact /><Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold"><ArrowLeft className="size-4" /> Minha NEXO</Link>
    </div></header>
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-10">
      <div><p className="text-xs font-bold uppercase tracking-[.2em] text-primary">Minha NEXO</p><h1 className="mt-2 text-3xl font-extrabold">Minha Assinatura</h1>
        <p className="mt-3 text-sm text-slate-500">Acompanhe suas mensalidades e gerencie seu acesso em um só lugar.</p></div>
      {!subscription ? <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
        <ShieldCheck className="mx-auto size-10 text-primary" /><h2 className="mt-4 text-xl font-bold">Você ainda não tem uma assinatura</h2>
        <p className="mt-2 text-sm text-slate-500">Conheça os imóveis e escolha o plano mensal em Solicitar informações.</p>
        <Link href="/imoveis" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white">Ver imóveis <ArrowRight className="size-4" /></Link>
      </section> : <>
        {subscriptions.length > 1 && <form className="flex flex-wrap items-end gap-3"><label className="text-sm font-semibold">Assinatura
          <select name="id" defaultValue={subscription.id} className="ml-3 rounded-xl border border-slate-200 bg-white p-3">{subscriptions.map(item => <option key={item.id} value={item.id}>{item.plano} · {item.created_at?.slice(0, 10)} · {item.id.slice(0, 8)}</option>)}</select>
        </label><button className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold">Consultar</button></form>}
        <SubscriptionSummary subscription={subscription} />
        {subscription.mp_preapproval_id ? <SubscriptionControls id={subscription.id} cancelled={subscription.status === 'cancelada'} amount={Number(subscription.valor)} email={user.email} publicKey={process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ?? ''} />
          : subscription.provider === 'cortesia' ? <p className="text-sm text-slate-600">Acesso de cortesia concedido pelo atendimento. Não há cobrança automática vinculada.</p>
          : <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Sua contratação está em processamento. O atendimento pode conferir a situação antes de uma nova tentativa.</p>}
        {subscription.checkout_url && subscription.status !== 'cancelada' && !subscription.metodo && <Link href={subscription.checkout_url} className="inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white">Concluir contratação no Mercado Pago</Link>}
        <ChargeHistory charges={history!.charges} />
        <nav className="flex items-center justify-between text-sm" aria-label="Páginas do histórico">
          {page > 1 ? <Link href={`?id=${subscription.id}&page=${page - 1}`}>Anterior</Link> : <span />}
          <span>{history!.total} cobranças · Página {page}</span>
          {page * 20 < history!.total ? <Link href={`?id=${subscription.id}&page=${page + 1}`}>Próxima</Link> : <span />}
        </nav>
      </>}
    </div>
  </main>;
}
