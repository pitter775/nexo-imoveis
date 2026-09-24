import { NextResponse } from 'next/server';
import { getCurrentAuthenticatedUser } from '@/lib/auth';
import {
  MONTHLY_ACCESS_PRICE,
  createMonthlySubscriptionPreapproval,
} from '@/lib/payments/mercado-pago';
import { userHasActiveMonthlySubscription } from '@/lib/payments/subscriptions';
import { getAbsoluteUrl, getPublicAbsoluteUrl } from '@/lib/site';
import { createAdminClient } from '@/lib/supabase/admin';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const user = await getCurrentAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: 'Login necessario para assinar.' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { imovelId?: string } | null;
  const imovelId = body?.imovelId?.trim();

  if (imovelId && !UUID_REGEX.test(imovelId)) {
    return NextResponse.json({ error: 'Imovel invalido.' }, { status: 400 });
  }

  if (user.tipo_usuario === 'admin' || (await userHasActiveMonthlySubscription(user.id))) {
    return NextResponse.json({
      alreadyUnlocked: true,
      redirectUrl: getPublicAbsoluteUrl(imovelId ? `/imoveis/${imovelId}?chat=1` : '/imoveis'),
    });
  }

  const supabase = createAdminClient() as any;
  const { data: assinatura, error: assinaturaError } = await supabase
    .from('assinaturas')
    .insert({
      user_id: user.id,
      imovel_referencia_id: imovelId || null,
      status: 'pendente',
      provider: 'mercado_pago',
      payer_email: user.email,
      valor: MONTHLY_ACCESS_PRICE,
    })
    .select('id')
    .single();

  if (assinaturaError) {
    return NextResponse.json(
      { error: `Nao foi possivel registrar a assinatura: ${assinaturaError.message}` },
      { status: 500 },
    );
  }

  try {
    const preapproval = await createMonthlySubscriptionPreapproval({
      assinaturaId: assinatura.id,
      reason: 'Plano mensal Nexo Leiloes',
      payerEmail: user.email,
      backUrl: getAbsoluteUrl(
        `/api/pagamentos/mercado-pago/assinatura/retorno?assinaturaId=${assinatura.id}`,
      ),
    });

    await supabase
      .from('assinaturas')
      .update({
        mp_preapproval_id: preapproval.preapprovalId,
        status: preapproval.status === 'authorized' ? 'ativa' : 'pendente',
        updated_at: new Date().toISOString(),
        ...(preapproval.status === 'authorized' ? { data_inicio: new Date().toISOString() } : {}),
      })
      .eq('id', assinatura.id);

    return NextResponse.json({
      checkoutUrl: preapproval.checkoutUrl,
      assinaturaId: assinatura.id,
      valor: MONTHLY_ACCESS_PRICE,
    });
  } catch (error) {
    await supabase
      .from('assinaturas')
      .update({ status: 'erro', updated_at: new Date().toISOString() })
      .eq('id', assinatura.id);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Nao foi possivel criar a assinatura no Mercado Pago.',
      },
      { status: 500 },
    );
  }
}
