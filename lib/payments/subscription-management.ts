import 'server-only';
import { createSubscriptionClient } from './subscription-management-db';
import { hasSubscriptionAccess, monthlyPeriodEnd } from './subscription-policy';
import { validateSubscriptionInvoice } from './subscription-invoice-validation';
import {
  getMercadoPagoPayment, getMercadoPagoPreapproval, getSubscriptionInvoice,
  mapMercadoPagoStatus, searchSubscriptionInvoices, type MercadoPagoPreapproval,
} from './mercado-pago';

export async function getManagedSubscriptions(userId: string) {
  const db = createSubscriptionClient();
  const { data, error } = await db.from('assinaturas').select('*')
    .eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw new Error('Não foi possível consultar as assinaturas.');
  if (!data?.length) return [];
  const now = new Date().toISOString();
  const { data: charges, error: chargesError } = await db.from('assinatura_cobrancas')
    .select('assinatura_id, periodo_fim').in('assinatura_id', data.map(item => item.id))
    .eq('status', 'pago').lte('vencimento', now).gt('periodo_fim', now);
  if (chargesError) throw chargesError;
  return data.map(subscription => {
    const activePeriods = (charges ?? []).filter(charge => charge.assinatura_id === subscription.id);
    const paidUntil = activePeriods.map(charge => charge.periodo_fim).sort().at(-1);
    // Uma fatura futura paga nao libera um intervalo sem cobertura.
    return { ...subscription, pago_ate: paidUntil ?? (
      Date.parse(subscription.pago_ate ?? '') <= Date.now() ? subscription.pago_ate : null
    ) };
  });
}

export async function syncManagedPreapproval(preapproval: MercadoPagoPreapproval) {
  const db = createSubscriptionClient();
  const { data: subscription, error } = await db.from('assinaturas').select('*')
    .eq('mp_preapproval_id', preapproval.id).maybeSingle();
  if (error) throw error;
  if (!subscription) return { assinaturaId: null, userId: null, imovelId: null, active: false };
  if (preapproval.external_reference !== subscription.id) throw new Error('Referência de assinatura divergente.');
  const modified = preapproval.last_modified;
  if (!modified || !Number.isFinite(Date.parse(modified))) throw new Error('Assinatura sem data de atualização.');
  const { error: updateError } = await db.from('assinaturas').update({
    status: preapproval.status === 'cancelled' || preapproval.status === 'canceled' ? 'cancelada'
      : preapproval.status === 'paused' ? 'pausada' : 'pendente',
    metodo: preapproval.payment_method_id ?? subscription.metodo,
    proxima_cobranca: ['cancelled', 'canceled'].includes(preapproval.status ?? '') ? null : preapproval.next_payment_date ?? null,
    provider_updated_at: modified,
    updated_at: new Date().toISOString(),
  }).eq('id', subscription.id)
    .or(`provider_updated_at.is.null,provider_updated_at.lte.${new Date(modified).toISOString()}`);
  if (updateError) throw updateError;
  const current = (await getManagedSubscriptions(subscription.user_id)).find(item => item.id === subscription.id);
  return { assinaturaId: subscription.id, userId: subscription.user_id,
    imovelId: subscription.imovel_referencia_id, active: current ? hasSubscriptionAccess(current) : false };
}

export async function syncManagedInvoice(invoiceId: string) {
  const invoice = await getSubscriptionInvoice(invoiceId);
  const db = createSubscriptionClient();
  const { data: subscription, error } = await db.from('assinaturas').select('*')
    .eq('mp_preapproval_id', invoice.preapproval_id).maybeSingle();
  if (error) throw error;
  if (!subscription) return;
  const preapproval = await getMercadoPagoPreapproval(invoice.preapproval_id);
  const payment = invoice.payment?.id ? await getMercadoPagoPayment(String(invoice.payment.id)) : null;
  const modified = validateSubscriptionInvoice(subscription, invoice, preapproval, payment);
  const { error: syncError } = await db.rpc('sync_assinatura_cobranca', { p_cobranca: {
    assinatura_id: subscription.id, referencia_gateway: String(invoice.id),
    pagamento_gateway: payment ? String(payment.id) : null,
    status: mapMercadoPagoStatus(payment?.status),
    valor: Number(invoice.transaction_amount), moeda: invoice.currency_id,
    metodo: payment?.payment_method_id ?? subscription.metodo,
    vencimento: invoice.debit_date, periodo_fim: monthlyPeriodEnd(invoice.debit_date),
    pago_em: payment?.date_approved ?? null, provider_updated_at: modified,
  } });
  if (syncError) throw syncError;
  await syncManagedPreapproval(preapproval);
}

export async function reconcileSubscription(preapprovalId: string) {
  await syncManagedPreapproval(await getMercadoPagoPreapproval(preapprovalId));
  let offset = 0;
  while (true) {
    const page = await searchSubscriptionInvoices(preapprovalId, offset);
    for (const invoice of page.results) await syncManagedInvoice(String(invoice.id));
    offset += page.results.length;
    if (!page.results.length || offset >= page.paging.total) break;
  }
}
