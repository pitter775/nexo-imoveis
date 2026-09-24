import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import {
  getMercadoPagoPreapproval,
  mapMercadoPagoPreapprovalStatus,
  type MercadoPagoPreapproval,
} from '@/lib/payments/mercado-pago';

const ACTIVE_SUBSCRIPTION_STATUSES = ['ativa', 'active', 'authorized'];

export async function userHasActiveMonthlySubscription(userId: string) {
  const supabase = createAdminClient() as any;
  const { data, error } = await supabase
    .from('assinaturas')
    .select('id, status, data_fim')
    .eq('user_id', userId)
    .in('status', ACTIVE_SUBSCRIPTION_STATUSES)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check monthly subscription: ${error.message}`);
  }

  if (!data) {
    return false;
  }

  return !data.data_fim || new Date(data.data_fim) > new Date();
}

export async function syncSubscriptionPreapproval(preapprovalId: string) {
  const preapproval = await getMercadoPagoPreapproval(preapprovalId);
  return persistSubscriptionPreapproval(preapproval);
}

async function persistSubscriptionPreapproval(preapproval: MercadoPagoPreapproval) {
  const supabase = createAdminClient() as any;
  const mappedStatus = mapMercadoPagoPreapprovalStatus(preapproval.status);
  const assinaturaId = preapproval.external_reference?.trim() || null;

  let query = supabase.from('assinaturas').update({
    status: mappedStatus,
    payer_email: preapproval.payer_email ?? null,
    updated_at: new Date().toISOString(),
    ...(mappedStatus === 'ativa' ? { data_inicio: new Date().toISOString(), data_fim: null } : {}),
    ...(mappedStatus === 'cancelada' || mappedStatus === 'pausada'
      ? { data_fim: new Date().toISOString() }
      : {}),
  });

  if (assinaturaId) {
    query = query.eq('id', assinaturaId);
  } else {
    query = query.eq('mp_preapproval_id', preapproval.id);
  }

  const { data, error } = await query.select('id, user_id, imovel_referencia_id, status').maybeSingle();

  if (error) {
    throw new Error(`Failed to update subscription: ${error.message}`);
  }

  return {
    assinaturaId: data?.id ?? assinaturaId,
    userId: data?.user_id ?? null,
    imovelId: data?.imovel_referencia_id ?? null,
    active: mappedStatus === 'ativa',
  };
}
