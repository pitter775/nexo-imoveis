import 'server-only';
import { createSubscriptionClient } from './subscription-management-db';
import { reconcileSubscription } from './subscription-management';
import { searchPreapprovalByReference } from './mercado-pago';
import { sendSubscriptionNotice } from '@/lib/email';
import { getPublicAbsoluteUrl } from '@/lib/site';

export async function runSubscriptionReconciliation() {
  const db = createSubscriptionClient();
  // As mais antigas primeiro: uma assinatura com erro nao impede a rotacao das demais.
  const { data, error } = await db.from('assinaturas').select('*').eq('provider', 'mercado_pago')
    .order('conciliado_em', { ascending: true, nullsFirst: true }).limit(10);
  if (error) throw error;
  let reconciled = 0;
  let failed = 0;
  for (const subscription of data ?? []) {
    let failure: string | null = null;
    try {
      let providerId = subscription.mp_preapproval_id;
      if (!providerId) {
        const found = await searchPreapprovalByReference(subscription.id);
        const matches = found.results.filter(item => item.external_reference === subscription.id);
        if (matches.length !== 1) throw new Error('Contratação exige conferência: nenhuma ou múltiplas assinaturas no provedor.');
        providerId = matches[0].id;
        const { error: linkError } = await db.from('assinaturas').update({
          mp_preapproval_id: providerId, checkout_url: matches[0].init_point ?? null,
        }).eq('id', subscription.id).is('mp_preapproval_id', null);
        if (linkError) throw linkError;
      }
      await reconcileSubscription(providerId);
      reconciled++;
    } catch (error) {
      failure = 'Não foi possível conciliar. Conferir integração e vínculo com o provedor.';
      console.error('[subscriptions] reconciliation failed', subscription.id, error);
      failed++;
    }
    const { error: saveError } = await db.from('assinaturas').update({
      conciliado_em: new Date().toISOString(), erro_conciliacao: failure,
    }).eq('id', subscription.id);
    if (saveError) throw saveError;
  }
  const notices = await sendPendingSubscriptionNotices();
  return { reconciled, failed, ...notices };
}

export async function sendPendingSubscriptionNotices() {
  const db = createSubscriptionClient();
  const { data, error } = await db.rpc('reservar_avisos_assinatura', {});
  if (error) throw error;
  let sent = 0;
  let mailFailed = 0;
  for (const notice of data ?? []) {
    try {
      const subscription = await db.from('assinaturas').select('user_id').eq('id', notice.assinatura_id).single();
      if (subscription.error) throw subscription.error;
      const user = await db.from('users').select('email').eq('id', subscription.data.user_id).single();
      if (user.error) throw user.error;
      const charge = await db.from('assinatura_cobrancas').select('status').eq('referencia_gateway', notice.referencia_gateway).single();
      if (charge.error) throw charge.error;
      // Descarta avisos superados, por exemplo recusa ja regularizada.
      if (charge.data.status === notice.tipo) {
        await sendSubscriptionNotice(user.data.email, notice.tipo === 'pago', getPublicAbsoluteUrl('/dashboard/assinatura'));
      }
      const saved = await db.from('assinatura_avisos').update({ enviado_em: new Date().toISOString() }).eq('id', notice.id);
      if (saved.error) throw saved.error;
      sent++;
    } catch (error) {
      console.error('[subscriptions] notice failed', notice.id, error);
      mailFailed++;
    }
  }
  return { sent, mailFailed };
}
