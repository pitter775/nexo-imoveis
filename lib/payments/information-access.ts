import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import {
  INFORMATION_ACCESS_PRICE,
  isMercadoPagoApproved,
  mapMercadoPagoStatus,
  type MercadoPagoPayment,
} from '@/lib/payments/mercado-pago';

type PaymentUpdateResult = {
  pagamentoId: string | null;
  imovelId: string | null;
  approved: boolean;
};

export async function userHasActivePropertyAccess(userId: string, imovelId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('user_access')
    .select('id, data_expiracao')
    .eq('user_id', userId)
    .eq('imovel_id', imovelId)
    .eq('status', 'ativo')
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check property access: ${error.message}`);
  }

  if (!data) {
    return false;
  }

  return !data.data_expiracao || new Date(data.data_expiracao) > new Date();
}

export async function syncInformationPayment(payment: MercadoPagoPayment): Promise<PaymentUpdateResult> {
  const pagamentoId = payment.external_reference?.trim() || null;

  if (!pagamentoId) {
    return { pagamentoId: null, imovelId: null, approved: false };
  }

  const supabase = createAdminClient();
  const { data: pagamento, error: pagamentoError } = await supabase
    .from('pagamentos')
    .select('id, user_id')
    .eq('id', pagamentoId)
    .maybeSingle();

  if (pagamentoError) {
    throw new Error(`Failed to load payment: ${pagamentoError.message}`);
  }

  if (!pagamento?.user_id) {
    return { pagamentoId, imovelId: null, approved: false };
  }

  const { data: item, error: itemError } = await supabase
    .from('pagamentos_itens')
    .select('imovel_id, valor')
    .eq('pagamento_id', pagamentoId)
    .maybeSingle();

  if (itemError) {
    throw new Error(`Failed to load payment item: ${itemError.message}`);
  }

  if (!item?.imovel_id) {
    return { pagamentoId, imovelId: null, approved: false };
  }

  const mappedStatus = mapMercadoPagoStatus(payment.status);
  const amount = Number(payment.transaction_amount ?? 0);
  const approved = isMercadoPagoApproved(payment.status) && amount >= INFORMATION_ACCESS_PRICE;

  const { error: updateError } = await supabase
    .from('pagamentos')
    .update({
      status: approved ? 'pago' : mappedStatus,
      referencia_gateway: String(payment.id),
    })
    .eq('id', pagamentoId);

  if (updateError) {
    throw new Error(`Failed to update payment: ${updateError.message}`);
  }

  if (approved) {
    const hasAccess = await userHasActivePropertyAccess(pagamento.user_id, item.imovel_id);

    if (!hasAccess) {
      const { error: accessError } = await supabase.from('user_access').insert({
        user_id: pagamento.user_id,
        imovel_id: item.imovel_id,
        status: 'ativo',
      });

      if (accessError) {
        throw new Error(`Failed to grant property access: ${accessError.message}`);
      }
    }
  }

  return { pagamentoId, imovelId: item.imovel_id, approved };
}
