import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHmac } from 'node:crypto';
import { hasSubscriptionAccess, monthlyPeriodEnd, subscriptionStatus } from '../../lib/payments/subscription-policy.ts';
import { validateWebhookSignature } from '../../lib/payments/webhook-signature.ts';
import { assertSubscriptionCheckoutConfigured, subscriptionConfiguration } from '../../lib/payments/subscription-configuration.ts';
import { validateSubscriptionInvoice } from '../../lib/payments/subscription-invoice-validation.ts';

const now = Date.parse('2026-10-05T12:00:00Z');
const paid = { status: 'pendente', pago_ate: '2026-11-01T12:00:00Z', acesso_manual: null, acesso_manual_ate: null };

test('autorização sem mensalidade confirmada não libera acesso', () => {
  assert.equal(hasSubscriptionAccess({ ...paid, status: 'authorized', pago_ate: null }, now), false);
});
test('cancelamento preserva período pago, mas expiração remove acesso', () => {
  assert.equal(hasSubscriptionAccess({ ...paid, status: 'cancelada' }, now), true);
  assert.equal(subscriptionStatus({ ...paid, status: 'cancelada' }, now), 'cancelada');
  assert.equal(hasSubscriptionAccess(paid, Date.parse(paid.pago_ate)), false);
});
test('suspensão prevalece sobre pagamento; cortesia expira sem criar período pago', () => {
  assert.equal(hasSubscriptionAccess({ ...paid, acesso_manual: 'suspenso' }, now), false);
  const courtesy = { ...paid, pago_ate: null, acesso_manual: 'concedido', acesso_manual_ate: paid.pago_ate };
  assert.equal(hasSubscriptionAccess(courtesy, now), true);
  assert.equal(hasSubscriptionAccess(courtesy, Date.parse(paid.pago_ate)), false);
});
test('recusa de renovação não remove o período ainda pago', () => {
  assert.equal(hasSubscriptionAccess({ ...paid, proxima_cobranca: '2026-10-01T12:00:00Z' }, now), true);
  assert.equal(subscriptionStatus({ ...paid, pago_ate: '2026-10-01T12:00:00Z' }, now), 'atrasada');
});
test('ciclos respeitam fim do mês, ano bissexto e virada do ano', () => {
  assert.equal(monthlyPeriodEnd('2026-01-31T15:00:00Z'), '2026-02-28T15:00:00.000Z');
  assert.equal(monthlyPeriodEnd('2028-01-31T15:00:00Z'), '2028-02-29T15:00:00.000Z');
  assert.equal(monthlyPeriodEnd('2026-12-15T15:00:00Z'), '2027-01-15T15:00:00.000Z');
  assert.throws(() => monthlyPeriodEnd('inválido'));
});

const secret = 'segredo-ficticio-exclusivo-do-teste';
const digest = createHmac('sha256', secret).update('id:abc123;request-id:req-1;ts:1704908010;').digest('hex');
const headers = new Headers({ 'x-request-id': 'req-1', 'x-signature': `ts=1704908010,v1=${digest}` });
test('webhook aceita assinatura válida e repetição legítima', () => {
  assert.equal(validateWebhookSignature(headers, 'ABC123', secret), true);
  assert.equal(validateWebhookSignature(headers, 'ABC123', secret), true);
});
test('webhook rejeita recurso, segredo, request id ou digest alterados', () => {
  assert.equal(validateWebhookSignature(headers, 'outro', secret), false);
  assert.equal(validateWebhookSignature(headers, 'abc123', 'outro'), false);
  assert.equal(validateWebhookSignature(headers, 'abc123', undefined), false);
  const forged = new Headers(headers);
  forged.set('x-request-id', 'req-2');
  assert.equal(validateWebhookSignature(forged, 'abc123', secret), false);
  forged.set('x-signature', 'ts=1704908010,v1=zz');
  assert.equal(validateWebhookSignature(forged, 'abc123', secret), false);
});
test('configuração incompleta bloqueia contratação antes da reserva', () => {
  assert.throws(() => assertSubscriptionCheckoutConfigured({}));
  assert.throws(() => assertSubscriptionCheckoutConfigured({ MERCADO_PAGO_ACCESS_TOKEN: 'YOUR_ACCESS_TOKEN' }));
  assert.doesNotThrow(() => assertSubscriptionCheckoutConfigured({ MERCADO_PAGO_ACCESS_TOKEN: 'token-teste', MERCADO_PAGO_WEBHOOK_SECRET: secret }));
  assert.equal(JSON.stringify(subscriptionConfiguration({ MERCADO_PAGO_ACCESS_TOKEN: 'valor-privado' })).includes('valor-privado'), false);
});

const subscription = { id: 'sub-local', mp_preapproval_id: 'mp-sub', valor: 1 };
const invoice = { id: 'invoice-1', preapproval_id: 'mp-sub', currency_id: 'BRL', transaction_amount: '1.00', debit_date: '2026-10-05T12:00:00Z', last_modified: '2026-10-05T12:01:00Z', status: 'processed', payment: { id: 'payment-1', status: 'approved' } };
const preapproval = { id: 'mp-sub', external_reference: 'sub-local', auto_recurring: { frequency: 1, frequency_type: 'months' } };
const payment = { id: 'payment-1', status: 'approved', transaction_amount: 1, currency_id: 'BRL', date_approved: '2026-10-05T12:01:00Z', date_last_updated: '2026-10-05T12:02:00Z' };
test('fatura usa pagamento consultado e aceita estorno posterior', () => {
  assert.equal(validateSubscriptionInvoice(subscription, invoice, preapproval, payment), payment.date_last_updated);
  assert.doesNotThrow(() => validateSubscriptionInvoice(subscription, invoice, preapproval, { ...payment, status: 'refunded' }));
});
test('fatura rejeita pagamento ausente, alheio, moeda e valor divergentes', () => {
  assert.throws(() => validateSubscriptionInvoice(subscription, invoice, preapproval, null));
  for (const changes of [{ id: 'outro' }, { currency_id: 'USD' }, { transaction_amount: 0.5 }, { date_approved: undefined }]) {
    assert.throws(() => validateSubscriptionInvoice(subscription, invoice, preapproval, { ...payment, ...changes }));
  }
  assert.throws(() => validateSubscriptionInvoice(subscription, invoice, { ...preapproval, external_reference: 'outro-cliente' }, payment));
  assert.throws(() => validateSubscriptionInvoice(subscription, { ...invoice, debit_date: 'inválido' }, preapproval, payment));
});
test('fatura agendada pode ser registrada como pendente sem inventar pagamento', () => {
  assert.doesNotThrow(() => validateSubscriptionInvoice(subscription, { ...invoice, status: 'scheduled', payment: undefined }, preapproval, null));
});
