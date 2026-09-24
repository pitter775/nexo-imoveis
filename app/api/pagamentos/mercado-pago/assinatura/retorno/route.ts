import { NextResponse } from 'next/server';
import { syncSubscriptionPreapproval } from '@/lib/payments/subscriptions';
import { getPublicAbsoluteUrl } from '@/lib/site';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const assinaturaId = url.searchParams.get('assinaturaId')?.trim() ?? null;
  const preapprovalId =
    url.searchParams.get('preapproval_id')?.trim() ||
    url.searchParams.get('id')?.trim() ||
    null;

  let imovelId: string | null = null;
  let active = false;

  try {
    const resolvedPreapprovalId = preapprovalId ?? (await getPreapprovalIdByAssinatura(assinaturaId));

    if (resolvedPreapprovalId) {
      const result = await syncSubscriptionPreapproval(resolvedPreapprovalId);
      imovelId = result.imovelId;
      active = result.active;
    }
  } catch (error) {
    console.error('[mercado-pago] subscription return sync failed', error);
  }

  const destination = imovelId
    ? `/imoveis/${imovelId}${active ? '?chat=1&payment=approved' : '?payment=pending'}`
    : `/imoveis?payment=${active ? 'approved' : 'pending'}`;

  return NextResponse.redirect(getPublicAbsoluteUrl(destination));
}

async function getPreapprovalIdByAssinatura(assinaturaId: string | null) {
  if (!assinaturaId) {
    return null;
  }

  const supabase = createAdminClient() as any;
  const { data } = await supabase
    .from('assinaturas')
    .select('mp_preapproval_id')
    .eq('id', assinaturaId)
    .maybeSingle();

  return data?.mp_preapproval_id ?? null;
}
