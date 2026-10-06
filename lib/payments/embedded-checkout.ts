import { createHash } from 'node:crypto';

export const checkoutUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// A mesma tentativa so pode criar um pagamento para o mesmo usuario e imovel.
export function checkoutReference(userId: string, propertyId: string, attempt: string) {
  if (!checkoutUuid.test(attempt)) throw new Error('Tentativa inválida. Reabra o pagamento.');
  const hash = createHash('sha256').update(`${userId}:${propertyId}:${attempt}`).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

export function readCheckoutForm(value: unknown, email: string, monthly: boolean) {
  const form = value as Record<string, unknown> | null;
  if (!form || typeof form !== 'object') throw new Error('Confira os dados do pagamento.');
  const method = typeof form.payment_method_id === 'string' ? form.payment_method_id : '';
  const token = typeof form.token === 'string' ? form.token : undefined;
  if (monthly || method !== 'pix') {
    if (!token || !/^[a-z0-9_-]{10,200}$/i.test(token)) throw new Error('Confira os dados do cartão.');
  }
  if (!monthly && !['pix', 'visa', 'master', 'amex', 'elo', 'hipercard', 'naranja', 'cabal', 'diners', 'discover'].includes(method)) {
    throw new Error('Selecione Pix ou um cartão disponível.');
  }
  const payer = form.payer as { identification?: { type?: unknown; number?: unknown } } | undefined;
  const document = payer?.identification;
  const identification = document && ['CPF', 'CNPJ'].includes(String(document.type)) && /^\d{11}$|^\d{14}$/.test(String(document.number))
    ? { type: String(document.type), number: String(document.number) } : undefined;
  return { payment_method_id: method, token, issuer_id: typeof form.issuer_id === 'string' || typeof form.issuer_id === 'number' ? String(form.issuer_id) : undefined,
    payer: { email, ...(identification ? { identification } : {}) } };
}
