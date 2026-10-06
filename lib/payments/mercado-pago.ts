import 'server-only';

import { getAbsoluteUrl } from '@/lib/site';

export const INFORMATION_ACCESS_PRICE = 14.9;
// Valor temporario para homologacao controlada em producao. Restaurar para 119 apos o teste.
export const MONTHLY_ACCESS_PRICE = 1;
export const INFORMATION_ACCESS_CURRENCY = 'BRL';

type MercadoPagoPreferenceInput = {
  pagamentoId: string;
  imovelId: string;
  title: string;
  description?: string | null;
  unitPrice?: number;
  itemTitle?: string;
  payer: {
    email: string;
    name?: string | null;
  };
};

type MercadoPagoPreferenceResponse = {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
  message?: string;
};

type MercadoPagoPreapprovalInput = {
  assinaturaId: string;
  reason: string;
  payerEmail: string;
  backUrl: string;
  cardToken?: string;
};

export class SubscriptionCreationRejected extends Error {}

type MercadoPagoPreapprovalResponse = {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
  status?: string;
  external_reference?: string;
  payer_email?: string;
  message?: string;
  error?: string;
  cause?: Array<{ code?: string; description?: string }>;
  payment_method_id?: string;
  next_payment_date?: string;
  last_modified?: string;
  auto_recurring?: { transaction_amount?: number; currency_id?: string; frequency?: number; frequency_type?: string };
};

export type MercadoPagoPayment = {
  id: number | string;
  status?: string;
  external_reference?: string;
  transaction_amount?: number;
  currency_id?: string;
  payment_method_id?: string;
  date_approved?: string;
  date_last_updated?: string;
  date_of_expiration?: string;
  point_of_interaction?: { transaction_data?: { qr_code?: string; qr_code_base64?: string } };
};

export type MercadoPagoPreapproval = {
  id: string;
  status?: string;
  external_reference?: string;
  payer_email?: string;
  payment_method_id?: string;
  next_payment_date?: string;
  last_modified?: string;
  auto_recurring?: { transaction_amount?: number; currency_id?: string; frequency?: number; frequency_type?: string };
  init_point?: string;
};

function getMercadoPagoAccessToken() {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();

  if (!token) {
    throw new Error('MERCADO_PAGO_ACCESS_TOKEN nao configurado.');
  }

  return token;
}

export async function createInformationPreference({
  pagamentoId,
  imovelId,
  title,
  description,
  unitPrice = INFORMATION_ACCESS_PRICE,
  itemTitle,
  payer,
}: MercadoPagoPreferenceInput) {
  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getMercadoPagoAccessToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      external_reference: pagamentoId,
      notification_url: getAbsoluteUrl('/api/pagamentos/mercado-pago/webhook'),
      back_urls: {
        success: getAbsoluteUrl(
          `/api/pagamentos/mercado-pago/retorno?pagamentoId=${pagamentoId}&status=success`,
        ),
        pending: getAbsoluteUrl(
          `/api/pagamentos/mercado-pago/retorno?pagamentoId=${pagamentoId}&status=pending`,
        ),
        failure: getAbsoluteUrl(
          `/api/pagamentos/mercado-pago/retorno?pagamentoId=${pagamentoId}&status=failure`,
        ),
      },
      auto_return: 'approved',
      items: [
        {
          id: imovelId,
          title: itemTitle ?? `Informacoes do imovel - ${title}`,
          description: description?.slice(0, 240) || 'Acesso as informacoes detalhadas do imovel.',
          quantity: 1,
          currency_id: INFORMATION_ACCESS_CURRENCY,
          unit_price: unitPrice,
        },
      ],
      payer: {
        email: payer.email,
        name: payer.name || undefined,
      },
    }),
    signal: AbortSignal.timeout(15000),
  });

  const payload = (await response.json()) as MercadoPagoPreferenceResponse;

  if (!response.ok || !payload.id || !payload.init_point) {
    throw new Error(payload.message || 'Nao foi possivel criar o checkout do Mercado Pago.');
  }

  return {
    preferenceId: payload.id,
    checkoutUrl: payload.init_point,
    sandboxCheckoutUrl: payload.sandbox_init_point,
  };
}

export async function getMercadoPagoPayment(paymentId: string) {
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${getMercadoPagoAccessToken()}`,
    },
    signal: AbortSignal.timeout(15000),
  });

  const payload = (await response.json()) as MercadoPagoPayment & { message?: string };

  if (!response.ok) {
    throw new Error(payload.message || 'Nao foi possivel consultar o pagamento.');
  }

  return payload;
}

export async function createMonthlySubscriptionPreapproval({
  assinaturaId,
  reason,
  payerEmail,
  backUrl,
  cardToken,
}: MercadoPagoPreapprovalInput) {
  const response = await fetch('https://api.mercadopago.com/preapproval', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getMercadoPagoAccessToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reason,
      external_reference: assinaturaId,
      payer_email: payerEmail,
      back_url: backUrl,
      ...(cardToken ? { card_token_id: cardToken, status: 'authorized' } : {}),
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: MONTHLY_ACCESS_PRICE,
        currency_id: INFORMATION_ACCESS_CURRENCY,
      },
    }),
    signal: AbortSignal.timeout(15000),
  });

  const payload = (await response.json()) as MercadoPagoPreapprovalResponse;

  if ([400, 401, 403, 422].includes(response.status)) {
    const providerReason = [
      payload.message,
      payload.error,
      ...(payload.cause ?? []).flatMap(cause => [cause.code, cause.description]),
    ].filter(Boolean).join(' | ').replace(/\s+/g, ' ').slice(0, 240);
    throw new SubscriptionCreationRejected(
      `Mercado Pago recusou a criação da assinatura (${response.status})${providerReason ? `: ${providerReason}` : '.'}`,
    );
  }

  if (!response.ok || !payload.id || (!cardToken && !payload.init_point)) {
    throw new Error(payload.message || 'Nao foi possivel criar a assinatura no Mercado Pago.');
  }

  return {
    preapprovalId: payload.id,
    checkoutUrl: payload.init_point ?? null,
    sandboxCheckoutUrl: payload.sandbox_init_point,
    status: payload.status,
  };
}

export async function getMercadoPagoPreapproval(preapprovalId: string) {
  const response = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
    headers: {
      Authorization: `Bearer ${getMercadoPagoAccessToken()}`,
    },
    signal: AbortSignal.timeout(15000),
  });

  const payload = (await response.json()) as MercadoPagoPreapprovalResponse;

  if (!response.ok || !payload.id) {
    throw new Error(payload.message || 'Nao foi possivel consultar a assinatura.');
  }

  return {
    id: payload.id,
    status: payload.status,
    external_reference: payload.external_reference,
    payer_email: payload.payer_email,
    payment_method_id: payload.payment_method_id,
    next_payment_date: payload.next_payment_date,
    last_modified: payload.last_modified,
    auto_recurring: payload.auto_recurring,
    init_point: payload.init_point,
  };
}

export type MercadoPagoInvoice = {
  id: number | string;
  preapproval_id: string;
  currency_id: string;
  transaction_amount: number | string;
  debit_date: string;
  last_modified: string;
  status: string;
  payment?: { id?: number | string; status?: string };
};

export async function getSubscriptionInvoice(id: string): Promise<MercadoPagoInvoice> {
  return mercadoPagoRequest(`/authorized_payments/${encodeURIComponent(id)}`);
}

export async function searchSubscriptionInvoices(preapprovalId: string, offset = 0): Promise<{
  results: MercadoPagoInvoice[]; paging: { total: number; offset: number; limit: number };
}> {
  return mercadoPagoRequest(`/authorized_payments/search?preapproval_id=${encodeURIComponent(preapprovalId)}&limit=50&offset=${offset}`);
}

export async function updateSubscriptionPayment(preapprovalId: string, cardToken: string) {
  await mercadoPagoRequest(`/preapproval/${encodeURIComponent(preapprovalId)}`, {
    method: 'PUT', body: JSON.stringify({ card_token_id: cardToken }),
  });
}

export async function cancelMercadoPagoSubscription(preapprovalId: string) {
  await mercadoPagoRequest(`/preapproval/${encodeURIComponent(preapprovalId)}`, {
    method: 'PUT', body: JSON.stringify({ status: 'cancelled' }),
  });
}

export async function authorizeSubscriptionCard(preapprovalId: string, cardToken: string) {
  await mercadoPagoRequest(`/preapproval/${encodeURIComponent(preapprovalId)}`, {
    method: 'PUT', body: JSON.stringify({ card_token_id: cardToken, status: 'authorized' }),
  });
}

export async function createEmbeddedPayment(reference: string, title: string, form: {
  payment_method_id: string; token?: string; issuer_id?: string; payer: { email: string; identification?: { type: string; number: string } };
}) {
  const response = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(20000),
    headers: { Authorization: `Bearer ${getMercadoPagoAccessToken()}`, 'Content-Type': 'application/json', 'X-Idempotency-Key': reference },
    body: JSON.stringify({ ...form, transaction_amount: INFORMATION_ACCESS_PRICE,
      description: `Informações do imóvel - ${title}`.slice(0, 240), external_reference: reference,
      notification_url: getAbsoluteUrl('/api/pagamentos/mercado-pago/webhook'),
      ...(form.payment_method_id === 'pix' ? {} : { installments: 1 }),
    }),
  });
  if (!response.ok) throw new Error(`Não foi possível processar o pagamento (${response.status}). Confira os dados e tente novamente.`);
  const payment = await response.json() as MercadoPagoPayment;
  if (!payment.id) throw new Error('Pagamento sem confirmação do provedor. Atualize a situação antes de tentar novamente.');
  return payment;
}

export async function searchPreapprovalByReference(reference: string): Promise<{ results: MercadoPagoPreapproval[] }> {
  return mercadoPagoRequest(`/preapproval/search?external_reference=${encodeURIComponent(reference)}`);
}

export async function searchInvoiceByPayment(paymentId: string): Promise<{ results: MercadoPagoInvoice[] }> {
  return mercadoPagoRequest(`/authorized_payments/search?payment_id=${encodeURIComponent(paymentId)}`);
}

async function mercadoPagoRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${getMercadoPagoAccessToken()}`, 'Content-Type': 'application/json' },
    cache: 'no-store', signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Mercado Pago indisponível (${response.status}). Tente novamente.`);
  return response.json() as Promise<T>;
}

export function mapMercadoPagoStatus(status: string | null | undefined) {
  if (status === 'approved') {
    return 'pago';
  }

  if (status === 'rejected') {
    return 'recusado';
  }

  if (status === 'cancelled') {
    return 'cancelado';
  }

  if (status === 'refunded' || status === 'charged_back') {
    return 'estornado';
  }

  return 'pendente';
}

export function isMercadoPagoApproved(status: string | null | undefined) {
  return status === 'approved';
}

export function mapMercadoPagoPreapprovalStatus(status: string | null | undefined) {
  if (status === 'authorized') {
    return 'ativa';
  }

  if (status === 'cancelled') {
    return 'cancelada';
  }

  if (status === 'paused') {
    return 'pausada';
  }

  return 'pendente';
}
