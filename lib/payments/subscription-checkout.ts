import 'server-only';
import { createSubscriptionClient } from './subscription-management-db';
import { createMonthlySubscriptionPreapproval, MONTHLY_ACCESS_PRICE } from './mercado-pago';
import { getAbsoluteUrl } from '@/lib/site';

export async function startManagedSubscription(user: { id: string; email: string }, imovelId: string | null) {
  const db = createSubscriptionClient();
  const { data, error } = await db.rpc('reservar_assinatura', {
    p_usuario: user.id, p_imovel: imovelId, p_email: user.email, p_valor: MONTHLY_ACCESS_PRICE,
  });
  if (error) throw error;
  const reservation = data as { id: string; nova: boolean; checkout_url?: string; mp_preapproval_id?: string };
  if (!reservation.nova) {
    return { assinaturaId: reservation.id, checkoutUrl: reservation.checkout_url ?? null,
      managementUrl: '/dashboard/assinatura' };
  }
  // Em timeout, preservar a reserva: conciliacao recupera pelo external_reference.
  // Nunca criar outra assinatura sem saber o resultado da primeira.
  const preapproval = await createMonthlySubscriptionPreapproval({
    assinaturaId: reservation.id, reason: 'Plano mensal Nexo Leilões', payerEmail: user.email,
    backUrl: getAbsoluteUrl(`/api/pagamentos/mercado-pago/assinatura/retorno?assinaturaId=${reservation.id}`),
  });
  const { error: saveError } = await db.from('assinaturas').update({
    mp_preapproval_id: preapproval.preapprovalId, checkout_url: preapproval.checkoutUrl,
    status: 'pendente', updated_at: new Date().toISOString(),
  }).eq('id', reservation.id);
  if (saveError) throw saveError;
  return { assinaturaId: reservation.id, checkoutUrl: preapproval.checkoutUrl };
}
