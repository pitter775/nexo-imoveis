'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin, requireAuthenticatedUser } from '@/lib/auth';
import { createSubscriptionClient } from './subscription-management-db';
import { cancelMercadoPagoSubscription, getMercadoPagoPreapproval, updateSubscriptionPayment } from './mercado-pago';
import { reconcileSubscription, syncManagedPreapproval } from './subscription-management';

export type SubscriptionActionResult = { ok: boolean; message: string };

function refresh() {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/assinatura');
  revalidatePath('/admin/assinaturas');
  revalidatePath('/admin/pagamentos');
  revalidatePath('/admin');
}

export async function manageOwnSubscription(id: string, action: 'cancel' | 'refresh' | 'card', token?: string): Promise<SubscriptionActionResult> {
  const user = await requireAuthenticatedUser();
  try {
    const db = createSubscriptionClient();
    const { data, error } = await db.from('assinaturas').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
    if (error || !data?.mp_preapproval_id) return { ok: false, message: 'Assinatura não disponível para esta operação.' };
    if (action === 'cancel') {
      if (data.status !== 'cancelada') await cancelMercadoPagoSubscription(data.mp_preapproval_id);
      await syncManagedPreapproval(await getMercadoPagoPreapproval(data.mp_preapproval_id));
    } else if (action === 'card') {
      if (!token || !/^[a-z0-9_-]{10,200}$/i.test(token) || data.status === 'cancelada') return { ok: false, message: 'Cartão ou assinatura inválida.' };
      await updateSubscriptionPayment(data.mp_preapproval_id, token);
      await syncManagedPreapproval(await getMercadoPagoPreapproval(data.mp_preapproval_id));
    } else if (action === 'refresh') {
      await reconcileSubscription(data.mp_preapproval_id);
    } else return { ok: false, message: 'Operação inválida.' };
    refresh();
    return { ok: true, message: action === 'cancel'
      ? 'Renovação cancelada. O período já pago permanece disponível.'
      : action === 'card' ? 'Forma de pagamento atualizada.' : 'Situação atualizada.' };
  } catch (error) {
    console.error('[subscriptions] customer action failed', error);
    return { ok: false, message: 'Não foi possível confirmar a operação. Atualize a situação antes de tentar novamente.' };
  }
}

export async function manageSubscriptionAccess(form: FormData): Promise<SubscriptionActionResult> {
  const admin = await requireAdmin();
  const id = String(form.get('id') ?? '');
  const action = String(form.get('acao') ?? '');
  const reason = String(form.get('motivo') ?? '').trim();
  const days = Number(form.get('dias'));
  if (!['conceder', 'suspender', 'reativar'].includes(action) || reason.length < 5 || reason.length > 1000 ||
      (action === 'conceder' && (!Number.isInteger(days) || days < 1 || days > 365))) {
    return { ok: false, message: 'Informe uma ação, motivo com pelo menos 5 caracteres e validade de 1 a 365 dias para a cortesia.' };
  }
  try {
    const { error } = await createSubscriptionClient().rpc('alterar_acesso_assinatura', {
      p_assinatura: id, p_administrador: admin.id, p_acao: action, p_motivo: reason,
      p_ate: action === 'conceder' ? new Date(Date.now() + days * 86400000).toISOString() : null,
    });
    if (error) throw error;
    refresh();
    revalidatePath(`/admin/assinaturas/${id}`);
    return { ok: true, message: 'Acesso atualizado e alteração registrada na auditoria.' };
  } catch (error) {
    console.error('[subscriptions] admin access action failed', error);
    return { ok: false, message: 'Não foi possível alterar o acesso.' };
  }
}

export async function grantSubscriptionCourtesy(form: FormData): Promise<SubscriptionActionResult> {
  const admin = await requireAdmin();
  const email = String(form.get('email') ?? '').trim();
  const reason = String(form.get('motivo') ?? '').trim();
  const days = Number(form.get('dias'));
  if (!email.includes('@') || reason.length < 5 || reason.length > 1000 || !Number.isInteger(days) || days < 1 || days > 365) {
    return { ok: false, message: 'Informe e-mail, motivo e validade entre 1 e 365 dias.' };
  }
  try {
    const { error } = await createSubscriptionClient().rpc('conceder_cortesia_assinatura', {
      p_email: email, p_administrador: admin.id, p_motivo: reason,
      p_ate: new Date(Date.now() + days * 86400000).toISOString(),
    });
    if (error) throw error;
    refresh();
    return { ok: true, message: 'Cortesia concedida e registrada. Nenhuma cobrança foi criada.' };
  } catch (error) {
    console.error('[subscriptions] courtesy failed', error);
    return { ok: false, message: 'Não foi possível conceder cortesia. Confira se o cliente está cadastrado e ativo.' };
  }
}
