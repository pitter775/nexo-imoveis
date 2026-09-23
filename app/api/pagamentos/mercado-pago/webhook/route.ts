import { NextResponse } from 'next/server';
import { getMercadoPagoPayment } from '@/lib/payments/mercado-pago';
import { syncInformationPayment } from '@/lib/payments/information-access';

function getPaymentIdFromUrl(url: URL) {
  return (
    url.searchParams.get('data.id') ||
    url.searchParams.get('id') ||
    url.searchParams.get('payment_id') ||
    null
  );
}

function getPaymentIdFromBody(body: unknown) {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const payload = body as {
    id?: string | number;
    resource?: string;
    data?: { id?: string | number };
  };

  if (payload.data?.id) {
    return String(payload.data.id);
  }

  if (payload.resource?.includes('/')) {
    return payload.resource.split('/').filter(Boolean).at(-1) ?? null;
  }

  return payload.id ? String(payload.id) : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const paymentId = getPaymentIdFromUrl(url);

  if (paymentId) {
    await syncPaymentById(paymentId);
  }

  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const body = await request.json().catch(() => null);
  const paymentId = getPaymentIdFromBody(body) || getPaymentIdFromUrl(url);

  if (paymentId) {
    await syncPaymentById(paymentId);
  }

  return NextResponse.json({ ok: true });
}

async function syncPaymentById(paymentId: string) {
  try {
    const payment = await getMercadoPagoPayment(paymentId);
    await syncInformationPayment(payment);
  } catch (error) {
    console.error('[mercado-pago] webhook sync failed', error);
  }
}
