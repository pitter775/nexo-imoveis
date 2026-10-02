import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { subscriptionManagementEnabled } from '@/lib/payments/subscription-management-db';
import { runSubscriptionReconciliation } from '@/lib/payments/subscription-reconciliation';

export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const token = request.headers.get('authorization');
  if (!secret || !token) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const actual = Buffer.from(token);
  const expected = Buffer.from(`Bearer ${secret}`);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  if (!subscriptionManagementEnabled()) return NextResponse.json({ enabled: false });
  try {
    const result = await runSubscriptionReconciliation();
    return NextResponse.json(result, { status: result.failed || result.mailFailed ? 503 : 200 });
  } catch (error) {
    console.error('[subscriptions] scheduled reconciliation failed', error);
    return NextResponse.json({ error: 'Falha na conciliação.' }, { status: 503 });
  }
}
