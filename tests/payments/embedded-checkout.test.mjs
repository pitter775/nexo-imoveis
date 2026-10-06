import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkoutReference, checkoutUuid, readCheckoutForm } from '../../lib/payments/embedded-checkout.ts';

const attempt = '1b012073-00fd-42bc-9b14-c80412345678';
test('reenvio da mesma tentativa usa a mesma chave; usuarios e imoveis nao compartilham pagamentos', () => {
  const id = checkoutReference('user1', 'property1', attempt);
  assert.match(id, checkoutUuid);
  assert.equal(id, checkoutReference('user1', 'property1', attempt));
  assert.notEqual(id, checkoutReference('user2', 'property1', attempt));
  assert.notEqual(id, checkoutReference('user1', 'property2', attempt));
  assert.throws(() => checkoutReference('user1', 'property1', 'invalida'));
});
test('formulario avulso nao aceita preco, parcelas, email ou referencia controlados pelo navegador', () => {
  const form = readCheckoutForm({ payment_method_id: 'pix', transaction_amount: 0.01, installments: 12,
    external_reference: 'outro', payer: { email: 'outro@example.com', identification: { type: 'CPF', number: '12345678901' } } }, 'sessao@example.com', false);
  assert.equal(form.payer.email, 'sessao@example.com');
  const pixSemFormulario = readCheckoutForm({ payment_method_id: 'pix' }, 'sessao@example.com', false);
  assert.deepEqual(pixSemFormulario.payer, { email: 'sessao@example.com' });
  assert.equal(form.transaction_amount, undefined);
  assert.equal(form.installments, undefined);
  assert.equal(form.external_reference, undefined);
  assert.equal(form.payer.identification.type, 'CPF');
});
test('mensal exige token de cartao; Pix avulso nao cria recorrencia', () => {
  assert.throws(() => readCheckoutForm({ payment_method_id: 'pix' }, 'user@example.com', true));
  assert.throws(() => readCheckoutForm({ payment_method_id: 'visa', card_number: '1234' }, 'user@example.com', false));
  const form = readCheckoutForm({ payment_method_id: 'visa', token: 'token-ficticio-seguro', card_number: '1234', security_code: '123' }, 'user@example.com', true);
  assert.equal(form.token, 'token-ficticio-seguro');
  assert.equal(form.card_number, undefined);
  assert.equal(form.security_code, undefined);
});
