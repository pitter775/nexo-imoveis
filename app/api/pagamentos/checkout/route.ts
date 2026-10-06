import { NextResponse } from 'next/server';
import { getCurrentAuthenticatedUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createSubscriptionClient } from '@/lib/payments/subscription-management-db';
import { startManagedSubscription } from '@/lib/payments/subscription-checkout';
import { assertSubscriptionCheckoutConfigured } from '@/lib/payments/subscription-configuration';
import { checkoutReference, checkoutUuid, readCheckoutForm } from '@/lib/payments/embedded-checkout';
import { canAccessPropertyInformation } from '@/lib/payments/property-access';
import { syncInformationPayment } from '@/lib/payments/information-access';
import { getManagedSubscriptions, reconcileSubscription } from '@/lib/payments/subscription-management';
import { hasSubscriptionAccess } from '@/lib/payments/subscription-policy';
import { createEmbeddedPayment, getMercadoPagoPayment, INFORMATION_ACCESS_PRICE, MONTHLY_ACCESS_PRICE, type MercadoPagoPayment } from '@/lib/payments/mercado-pago';

export const maxDuration = 60;
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });

function paymentResult(id: string, payment: MercadoPagoPayment, approved: boolean) {
  const pix = payment.point_of_interaction?.transaction_data;
  return { id, approved, status: payment.status, expiresAt: payment.date_of_expiration ?? null,
    pix: payment.payment_method_id === 'pix' && !approved && !['cancelled', 'rejected', 'refunded'].includes(payment.status ?? '')
      ? { code: pix?.qr_code ?? '', image: pix?.qr_code_base64 ?? '' } : null };
}

export async function GET(request: Request) {
  const user = await getCurrentAuthenticatedUser();
  if (!user) return json({ error: 'Entre na sua conta para continuar.' }, 401);
  const params = new URL(request.url).searchParams;
  const id = params.get('id');
  const monthly = params.get('plano') === 'mensal';
  try {
    if (!id) {
      const key = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY?.trim();
      if (!key) return json({ error: 'O formulário de pagamento ainda está sendo configurado. Tente novamente em instantes.' }, 503);
      assertSubscriptionCheckoutConfigured(process.env);
      return json({ publicKey: key, email: user.email, userId: user.id, amount: monthly ? MONTHLY_ACCESS_PRICE : INFORMATION_ACCESS_PRICE });
    }
    if (!checkoutUuid.test(id)) return json({ error: 'Pagamento inválido.' }, 400);
    if (monthly) {
      const db = createSubscriptionClient();
      const { data, error } = await db.from('assinaturas').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: 'Assinatura não encontrada.' }, 404);
      if (data.mp_preapproval_id) await reconcileSubscription(data.mp_preapproval_id);
      const current = (await getManagedSubscriptions(user.id)).find(item => item.id === id);
      return json({ id, approved: Boolean(current && hasSubscriptionAccess(current)), status: current?.status ?? 'pendente' });
    }
    const db = createAdminClient();
    const { data, error } = await db.from('pagamentos').select('referencia_gateway').eq('id', id).eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    if (!data) return json({ error: 'Pagamento não encontrado.' }, 404);
    if (!data.referencia_gateway || !/^\d+$/.test(data.referencia_gateway)) return json({ id, approved: false, status: 'pending' });
    const payment = await getMercadoPagoPayment(data.referencia_gateway);
    if (payment.external_reference !== id) throw new Error('Referência divergente.');
    const synced = await syncInformationPayment(payment);
    return json(paymentResult(id, payment, synced.approved));
  } catch (error) {
    console.error('[checkout] status/configuration failed', error);
    return json({ error: 'Não foi possível consultar o pagamento. Tente atualizar a situação em instantes.' }, 503);
  }
}

export async function POST(request: Request) {
  const user = await getCurrentAuthenticatedUser();
  if (!user) return json({ error: 'Entre na sua conta para continuar.' }, 401);
  if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) return json({ error: 'Origem inválida.' }, 403);
  const body = await request.json().catch(() => null);
  if (!body || !checkoutUuid.test(body.imovelId ?? '') || !['imovel', 'mensal'].includes(body.plano)) return json({ error: 'Plano ou imóvel inválido.' }, 400);
  const monthly = body.plano === 'mensal';
  let form;
  let reference: string;
  try {
    form = readCheckoutForm(body.formData, user.email, monthly);
    reference = checkoutReference(user.id, body.imovelId, body.attempt ?? '');
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Dados inválidos.' }, 400); }
  try {
    assertSubscriptionCheckoutConfigured(process.env);
    const db = createAdminClient();
    const property = await db.from('imoveis').select('id, titulo').eq('id', body.imovelId).maybeSingle();
    if (property.error) throw property.error;
    if (!property.data) return json({ error: 'Imóvel não encontrado.' }, 404);
    if (await canAccessPropertyInformation(user, body.imovelId)) return json({ approved: true });
    if (monthly) {
      const result = await startManagedSubscription(user, body.imovelId, form.token);
      if (!result.embedded) return json({ error: 'Há uma contratação anterior em andamento. Confira Minha Assinatura antes de pagar novamente.', managementUrl: '/dashboard/assinatura' }, 409);
      return json({ id: result.assinaturaId, approved: false, status: 'pending' });
    }
    // PKs e chave de idempotencia compartilham a referencia deterministica da tentativa.
    const inserted = await db.from('pagamentos').upsert({ id: reference, user_id: user.id, valor: INFORMATION_ACCESS_PRICE, metodo: form.payment_method_id, status: 'pendente' }, { onConflict: 'id', ignoreDuplicates: true });
    if (inserted.error) throw inserted.error;
    const row = await db.from('pagamentos').select('valor, referencia_gateway').eq('id', reference).eq('user_id', user.id).single();
    if (row.error) throw row.error;
    if (Number(row.data.valor) !== INFORMATION_ACCESS_PRICE) throw new Error('Valor divergente.');
    const item = await db.from('pagamentos_itens').upsert({ id: reference, pagamento_id: reference, imovel_id: body.imovelId, valor: INFORMATION_ACCESS_PRICE }, { onConflict: 'id', ignoreDuplicates: true });
    if (item.error) throw item.error;
    const payment = row.data.referencia_gateway
      ? await getMercadoPagoPayment(row.data.referencia_gateway)
      : await createEmbeddedPayment(reference, property.data.titulo, form);
    if (payment.external_reference !== reference) throw new Error('Referência divergente.');
    const synced = await syncInformationPayment(payment);
    return json(paymentResult(reference, payment, synced.approved));
  } catch (error) {
    console.error('[checkout] submission failed', error);
    return json({ error: 'Não foi possível confirmar o pagamento. Confira os dados e tente novamente. Se já pagou, consulte Minha NEXO antes de iniciar outra cobrança.' }, 503);
  }
}
