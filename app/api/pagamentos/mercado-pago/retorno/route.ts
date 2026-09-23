import { NextResponse } from 'next/server';
import { getMercadoPagoPayment } from '@/lib/payments/mercado-pago';
import { syncInformationPayment } from '@/lib/payments/information-access';
import { getPublicAbsoluteUrl } from '@/lib/site';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pagamentoId = url.searchParams.get('pagamentoId')?.trim() ?? null;
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

    if (!imovelId && pagamentoId) {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from('pagamentos_itens')
        .select('imovel_id')
        .eq('pagamento_id', pagamentoId)
        .maybeSingle();
      imovelId = data?.imovel_id ?? null;
    }
  } catch (error) {
    console.error('[mercado-pago] return sync failed', error);
  }

  const destination = imovelId
    ? `/imoveis/${imovelId}${approved ? '?chat=1&payment=approved' : '?payment=pending'}`
    : '/imoveis?payment=pending';

  return NextResponse.redirect(getPublicAbsoluteUrl(destination));
}
