import 'server-only';
import { createSubscriptionClient } from './subscription-management-db';
import { subscriptionManagementEnabled } from './subscription-management-db';

export async function getSubscriptionMetrics() {
  if (!subscriptionManagementEnabled()) return null;
  const { data, error } = await createSubscriptionClient().rpc('metricas_assinaturas', {});
  if (error) throw error;
  return data as { ativas: number; previsao: number; recebido: number; pagas: number };
}

export async function getSubscriptionHistory(id: string, page = 1, includeAudit = false) {
  const db = createSubscriptionClient();
  const [charges, audit] = await Promise.all([
    db.from('assinatura_cobrancas').select('*', { count: 'exact' }).eq('assinatura_id', id)
      .order('vencimento', { ascending: false }).range((page - 1) * 20, page * 20 - 1),
    includeAudit ? db.from('assinatura_auditoria').select('*').eq('assinatura_id', id)
      .order('created_at', { ascending: false }).limit(30) : Promise.resolve({ data: [], error: null }),
  ]);
  if (charges.error) throw charges.error;
  if (audit.error) throw audit.error;
  const actorIds = [...new Set((audit.data ?? []).map(item => item.administrador_id))];
  const actors = actorIds.length ? await db.from('users').select('id, nome, email').in('id', actorIds) : { data: [], error: null };
  if (actors.error) throw actors.error;
  return { charges: charges.data ?? [], total: charges.count ?? 0,
    audit: (audit.data ?? []).map(item => ({ ...item,
      administrador: actors.data?.find(actor => actor.id === item.administrador_id)?.nome ?? item.administrador_id,
    })) };
}

export async function getAdminSubscriptions(filters: { status?: string; metodo?: string; inicio?: string; fim?: string; page: number }) {
  const db = createSubscriptionClient();
  const now = new Date().toISOString();
  let query = db.from('assinaturas').select('*', { count: 'exact' });
  if (filters.status === 'ativa') query = query.not('status', 'in', '(cancelada,pausada)').gt('pago_ate', now);
  if (filters.status === 'pendente') query = query.not('status', 'in', '(cancelada,pausada)')
    .is('pago_ate', null).or(`proxima_cobranca.is.null,proxima_cobranca.gte.${now}`);
  if (filters.status === 'atrasada') query = query.not('status', 'in', '(cancelada,pausada)')
    .or(`pago_ate.lte.${now},and(pago_ate.is.null,proxima_cobranca.lt.${now})`);
  if (filters.status === 'cancelada' || filters.status === 'pausada') query = query.eq('status', filters.status);
  if (filters.metodo === 'cartao') query = query.in('metodo', ['visa', 'master', 'amex', 'elo', 'hipercard', 'credit_card']);
  else if (filters.metodo === 'pix' || filters.metodo === 'pix_automatico') query = query.eq('metodo', filters.metodo);
  if (validDate(filters.inicio)) query = query.gte('created_at', `${filters.inicio}T00:00:00-03:00`);
  if (validDate(filters.fim)) query = query.lte('created_at', `${filters.fim}T23:59:59.999-03:00`);
  const { data, error, count } = await query.order('created_at', { ascending: false })
    .range((filters.page - 1) * 20, filters.page * 20 - 1);
  if (error) throw error;
  const ids = [...new Set((data ?? []).map(item => item.user_id))];
  const users = ids.length ? await db.from('users').select('id, nome, email').in('id', ids) : { data: [], error: null };
  if (users.error) throw users.error;
  return { total: count ?? 0, subscriptions: (data ?? []).map(item => ({ ...item,
    cliente: users.data?.find(user => user.id === item.user_id),
  })) };
}

function validDate(value?: string): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)));
}

export function parsePage(value?: string) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 && number <= 100000 ? number : 1;
}
