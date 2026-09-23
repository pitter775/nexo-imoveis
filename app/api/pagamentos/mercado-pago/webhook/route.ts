import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
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

  if (!isValidWebhookSignature(request, paymentId)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

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

function isValidWebhookSignature(request: Request, paymentId: string | null) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim();

  if (!secret) {
    return true;
  }

  const signatureHeader = request.headers.get('x-signature');
  const requestId = request.headers.get('x-request-id');

  if (!paymentId || !signatureHeader || !requestId) {
    return false;
  }

  const signatureParts = new Map(
    signatureHeader.split(',').map((part) => {
      const [key, value] = part.split('=');
      return [key?.trim(), value?.trim()];
    }),
  );
  const timestamp = signatureParts.get('ts');
  const signature = signatureParts.get('v1');

  if (!timestamp || !signature) {
    return false;
  }

  const manifest = `id:${paymentId};request-id:${requestId};ts:${timestamp};`;
  const expected = createHmac('sha256', secret).update(manifest).digest('hex');

  try {
    const expectedBuffer = Buffer.from(expected, 'hex');
    const signatureBuffer = Buffer.from(signature, 'hex');

    return (
      expectedBuffer.length === signatureBuffer.length &&
      timingSafeEqual(expectedBuffer, signatureBuffer)
    );
  } catch {
    return false;
  }
}
