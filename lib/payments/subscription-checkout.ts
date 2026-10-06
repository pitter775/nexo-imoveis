import 'server-only';
import { createSubscriptionClient } from './subscription-management-db';
import { authorizeSubscriptionCard, createMonthlySubscriptionPreapproval, getMercadoPagoPreapproval, searchPreapprovalByReference, MONTHLY_ACCESS_PRICE, SubscriptionCreationRejected } from './mercado-pago';
import { getAbsoluteUrl } from '@/lib/site';
import { assertSubscriptionCheckoutConfigured } from './subscription-configuration';

export async function startManagedSubscription(user: { id: string; email: string }, imovelId: string | null, cardToken?: string) {
  // Falta de credenciais nao deve criar uma reserva que impeca nova tentativa.
  assertSubscriptionCheckoutConfigured(process.env);
  const db = createSubscriptionClient();
  const { data, error } = await db.rpc('reservar_assinatura', {
    p_usuario: user.id, p_imovel: imovelId, p_email: user.email, p_valor: MONTHLY_ACCESS_PRICE,
  });
  if (error) throw error;
  const reservation = data as { id: string; nova: boolean; checkout_url?: string; mp_preapproval_id?: string };
  if (!reservation.nova) {
    if (cardToken) {
      let providerId = reservation.mp_preapproval_id;
      if (!providerId) {
        const matches = (await searchPreapprovalByReference(reservation.id)).results.filter(item => item.external_reference === reservation.id);
        if (matches.length === 1) {
          providerId = matches[0].id;
          const linked = await db.from('assinaturas').update({ mp_preapproval_id: providerId })
            .eq('id', reservation.id).is('mp_preapproval_id', null);
          if (linked.error) throw linked.error;
        }
      }
      if (!providerId) return { assinaturaId: reservation.id, checkoutUrl: null, managementUrl: '/dashboard/assinatura' };
      const existing = await getMercadoPagoPreapproval(providerId);
      if (existing.external_reference !== reservation.id || Number(existing.auto_recurring?.transaction_amount) !== MONTHLY_ACCESS_PRICE ||
          existing.auto_recurring?.currency_id !== 'BRL' || !['pending', 'authorized'].includes(existing.status ?? '')) {
        return { assinaturaId: reservation.id, checkoutUrl: null, managementUrl: '/dashboard/assinatura' };
      }
      if (existing.status === 'pending') await authorizeSubscriptionCard(providerId, cardToken);
      return { assinaturaId: reservation.id, checkoutUrl: null, embedded: true };
    }
    // Nao reutilizar silenciosamente um checkout antigo de R$ 119 no teste de R$ 1.
    if (reservation.checkout_url && reservation.mp_preapproval_id) {
      const existing = await getMercadoPagoPreapproval(reservation.mp_preapproval_id);
      if (existing.external_reference !== reservation.id ||
          Number(existing.auto_recurring?.transaction_amount) !== MONTHLY_ACCESS_PRICE ||
          existing.auto_recurring?.currency_id !== 'BRL' ||
          ['cancelled', 'canceled'].includes(existing.status ?? '')) {
        return { assinaturaId: reservation.id, checkoutUrl: null, managementUrl: '/dashboard/assinatura' };
      }
    }
    return { assinaturaId: reservation.id, checkoutUrl: reservation.checkout_url ?? null,
      managementUrl: '/dashboard/assinatura' };
  }
  // Em timeout, preservar a reserva: conciliacao recupera pelo external_reference.
  // Nunca criar outra assinatura sem saber o resultado da primeira.
  const preapproval = await createMonthlySubscriptionPreapproval({
    assinaturaId: reservation.id, reason: 'Plano mensal Nexo Leilões', payerEmail: user.email,
    backUrl: getAbsoluteUrl(`/api/pagamentos/mercado-pago/assinatura/retorno?assinaturaId=${reservation.id}`),
    cardToken,
  }).catch(async error => {
    // Somente rejeicao explicita permite outra tentativa. Timeout/5xx mantem a reserva.
    if (error instanceof SubscriptionCreationRejected) {
      const result = await db.from('assinaturas').update({ status: 'erro', erro_conciliacao: error.message })
        .eq('id', reservation.id).is('mp_preapproval_id', null);
      if (result.error) throw result.error;
    }
    throw error;
  });
  const { error: saveError } = await db.from('assinaturas').update({
    mp_preapproval_id: preapproval.preapprovalId, checkout_url: preapproval.checkoutUrl,
    status: 'pendente', updated_at: new Date().toISOString(),
  }).eq('id', reservation.id);
  if (saveError) throw saveError;
  return { assinaturaId: reservation.id, checkoutUrl: preapproval.checkoutUrl, embedded: Boolean(cardToken) };
}
