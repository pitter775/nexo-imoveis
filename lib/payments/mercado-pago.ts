import 'server-only';

import { getAbsoluteUrl } from '@/lib/site';

export const INFORMATION_ACCESS_PRICE = 0.5;
export const INFORMATION_ACCESS_CURRENCY = 'BRL';

type MercadoPagoPreferenceInput = {
  pagamentoId: string;
  imovelId: string;
  title: string;
  description?: string | null;
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

export type MercadoPagoPayment = {
  id: number | string;
  status?: string;
  external_reference?: string;
  transaction_amount?: number;
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
          title: `Informacoes do imovel - ${title}`,
          description: description?.slice(0, 240) || 'Acesso as informacoes detalhadas do imovel.',
          quantity: 1,
          currency_id: INFORMATION_ACCESS_CURRENCY,
          unit_price: INFORMATION_ACCESS_PRICE,
        },
      ],
      payer: {
        email: payer.email,
        name: payer.name || undefined,
      },
    }),
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
  });

  const payload = (await response.json()) as MercadoPagoPayment & { message?: string };

  if (!response.ok) {
    throw new Error(payload.message || 'Nao foi possivel consultar o pagamento.');
  }

  return payload;
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
