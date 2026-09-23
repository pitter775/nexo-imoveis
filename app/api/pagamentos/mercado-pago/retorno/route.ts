import { NextResponse } from 'next/server';
import { getMercadoPagoPayment } from '@/lib/payments/mercado-pago';
import { syncInformationPayment } from '@/lib/payments/information-access';
import { getPublicAbsoluteUrl } from '@/lib/site';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pagamentoId = url.searchParams.get('pagamentoId')?.trim() ?? null;
  const preferenceId = url.searchParams.get('preference_id')?.trim() ?? null;
  const paymentId =
    url.searchParams.get('payment_id')?.trim() ||
    url.searchParams.get('collection_id')?.trim() ||
    null;

  let imovelId: string | null = null;
  let approved = false;

  try {
    if (paymentId) {
      const payment = await getMercadoPagoPayment(paymentId);
      const result = await syncInformationPayment(payment);
      imovelId = result.imovelId;
      approved = result.approved;
    }

    if (!imovelId) {
      const resolved = await resolvePaymentReturn({
        pagamentoId,
        preferenceId,
      });

      imovelId = resolved.imovelId;
      approved = approved || resolved.approved;
    }
  } catch (error) {
    console.error('[mercado-pago] return sync failed', error);
  }

  const destination = imovelId
    ? `/imoveis/${imovelId}${approved ? '?chat=1&payment=approved' : '?payment=pending'}`
    : '/imoveis?payment=pending';

  return NextResponse.redirect(getPublicAbsoluteUrl(destination));
}

async function resolvePaymentReturn({
  pagamentoId,
  preferenceId,
}: {
  pagamentoId: string | null;
  preferenceId: string | null;
}) {
  const supabase = createAdminClient();
  let resolvedPagamentoId = pagamentoId;
  let approved = false;

  if (!resolvedPagamentoId && preferenceId) {
    const { data: pagamento } = await supabase
      .from('pagamentos')
      .select('id, status')
      .eq('referencia_gateway', preferenceId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    resolvedPagamentoId = pagamento?.id ?? null;
    approved = ['pago', 'aprovado', 'concluido'].includes(pagamento?.status ?? '');
  }

  if (!resolvedPagamentoId) {
    return { imovelId: null, approved };
  }

  const [{ data: item }, { data: pagamento }] = await Promise.all([
    supabase
      .from('pagamentos_itens')
      .select('imovel_id')
      .eq('pagamento_id', resolvedPagamentoId)
      .limit(1)
      .maybeSingle(),
    supabase
      .from('pagamentos')
      .select('status')
      .eq('id', resolvedPagamentoId)
      .maybeSingle(),
  ]);

  return {
    imovelId: item?.imovel_id ?? null,
    approved:
      approved || ['pago', 'aprovado', 'concluido'].includes(pagamento?.status ?? ''),
  };
}
