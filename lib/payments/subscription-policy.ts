import type { ManagedSubscription } from './subscription-management-types';

export function hasSubscriptionAccess(subscription: ManagedSubscription, now = Date.now()) {
  if (subscription.acesso_manual === 'suspenso') return false;
  if (subscription.acesso_manual === 'concedido' &&
      Date.parse(subscription.acesso_manual_ate ?? '') > now) return true;
  return Date.parse(subscription.pago_ate ?? '') > now;
}

export function subscriptionStatus(subscription: ManagedSubscription, now = Date.now()) {
  if (subscription.status === 'cancelada') return 'cancelada';
  if (subscription.status === 'pausada') return 'pausada';
  if (Date.parse(subscription.pago_ate ?? '') > now) return 'ativa';
  if ((subscription.pago_ate && Date.parse(subscription.pago_ate) <= now) ||
      (subscription.proxima_cobranca && Date.parse(subscription.proxima_cobranca) < now)) return 'atrasada';
  return 'pendente';
}

// Mantem o dia do ciclo quando possivel (31/jan -> 28 ou 29/fev).
export function monthlyPeriodEnd(start: string) {
  const date = new Date(start);
  if (!Number.isFinite(date.getTime())) throw new Error('Vencimento inválido.');
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + 1);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.toISOString();
}

export const subscriptionLabels: Record<string, string> = {
  ativa: 'Ativa', pendente: 'Pendente', atrasada: 'Em atraso', cancelada: 'Cancelada', pausada: 'Pausada',
  pago: 'Pago', recusado: 'Recusado', cancelado: 'Cancelado', estornado: 'Estornado',
};

export function paymentMethodLabel(method: string | null) {
  if (!method) return 'Não informado';
  if (method === 'pix') return 'Pix';
  if (method === 'pix_automatico') return 'Pix Automático';
  if (method === 'account_money') return 'Saldo Mercado Pago';
  if (['visa', 'master', 'amex', 'elo', 'hipercard', 'credit_card'].includes(method)) return 'Cartão';
  return method;
}
