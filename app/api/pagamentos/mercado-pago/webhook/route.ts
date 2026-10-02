import { NextResponse } from 'next/server';
import { getMercadoPagoPayment, searchInvoiceByPayment } from '@/lib/payments/mercado-pago';
import { syncInformationPayment } from '@/lib/payments/information-access';
import { syncSubscriptionPreapproval } from '@/lib/payments/subscriptions';
import { syncManagedInvoice } from '@/lib/payments/subscription-management';
import { subscriptionManagementEnabled } from '@/lib/payments/subscription-management-db';
import { validateWebhookSignature } from '@/lib/payments/webhook-signature';

export async function POST(request: Request) {
  const url = new URL(request.url);
  const body = await request.json().catch(() => null);
  const bodyId = body?.data?.id == null ? null : String(body.data.id);
  const queryId = url.searchParams.get('data.id');
  const id = queryId ?? bodyId;
  if (!id || !/^[a-z0-9_-]+$/i.test(id) || (queryId && bodyId && queryId !== bodyId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!validateWebhookSignature(request.headers, id, process.env.MERCADO_PAGO_WEBHOOK_SECRET)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const type = body?.type ?? url.searchParams.get('type');
  try {
    if (type === 'subscription_preapproval') {
      await syncSubscriptionPreapproval(id);
    } else if (type === 'subscription_authorized_payment' && subscriptionManagementEnabled()) {
      await syncManagedInvoice(id);
    } else if (type === 'payment') {
      let subscriptionPayment = false;
      if (subscriptionManagementEnabled()) {
        const invoices = await searchInvoiceByPayment(id);
        subscriptionPayment = invoices.results.length > 0;
        for (const invoice of invoices.results) await syncManagedInvoice(String(invoice.id));
      }
      if (!subscriptionPayment) await syncInformationPayment(await getMercadoPagoPayment(id));
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[mercado-pago] webhook processing failed', error);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
