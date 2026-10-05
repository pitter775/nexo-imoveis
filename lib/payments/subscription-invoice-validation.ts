import type { MercadoPagoInvoice, MercadoPagoPayment, MercadoPagoPreapproval } from './mercado-pago';

export function validateSubscriptionInvoice(
  subscription: { id: string; mp_preapproval_id: string | null; valor: number },
  invoice: MercadoPagoInvoice,
  preapproval: MercadoPagoPreapproval,
  payment: MercadoPagoPayment | null,
) {
  if (invoice.preapproval_id !== subscription.mp_preapproval_id || preapproval.id !== invoice.preapproval_id ||
      preapproval.external_reference !== subscription.id || preapproval.auto_recurring?.frequency !== 1 ||
      preapproval.auto_recurring.frequency_type !== 'months') {
    throw new Error('Vínculo ou periodicidade de assinatura inválida.');
  }
  const amount = Number(subscription.valor);
  if (!Number.isFinite(amount) || amount <= 0 || invoice.currency_id !== 'BRL' ||
      Number(invoice.transaction_amount) !== amount ||
      (payment && (payment.currency_id !== 'BRL' || Number(payment.transaction_amount) !== amount))) {
    throw new Error('Cobrança com valor ou moeda divergente.');
  }
  if (payment && String(payment.id) !== String(invoice.payment?.id)) {
    throw new Error('Pagamento não corresponde à fatura.');
  }
  if (!payment && invoice.payment?.status === 'approved') {
    throw new Error('Fatura aprovada sem pagamento consultável.');
  }
  if (payment?.status === 'approved' && !Number.isFinite(Date.parse(payment.date_approved ?? ''))) {
    throw new Error('Pagamento aprovado sem data de confirmação.');
  }
  const modified = payment?.date_last_updated ?? invoice.last_modified;
  if (!modified || !Number.isFinite(Date.parse(modified))) throw new Error('Cobrança sem data de atualização.');
  if (!Number.isFinite(Date.parse(invoice.debit_date))) throw new Error('Vencimento inválido.');
  return modified;
}
